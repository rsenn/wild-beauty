const express = require("express");
const next = require("next");
const path = require("path");
const url = require("url");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const API = require("./stores/api.js")();
const jpeg = require("./utils/jpeg.js");
const Util = require("./utils/util.js");
const dom = require("./utils/dom.es5.js");
const { RGBA, HSLA } = dom;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const sharp = require("sharp");
const util = require("util");
const maxWidthOrHeight = 1024;
const MemoryStream = require("memory-stream");
const stream = require("stream");
const Alea = require("./utils/alea.js");
const Readable = stream.Readable;
const getColors = require("get-image-colors");
const tempfile = require("tempfile");
const cquant = require("cquant");
const jpegAutorotate = require("jpeg-autorotate");
const jpegQuality = require("jpegquality");
const exifr = require("exifr");
const fsPromises = require("fs").promises;

export async function loadFile(path) {
  let data = await fs.readFile(path);

  return data;
}

export async function bufferToStream(buffer) {
  let stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

var secret = fs.readFileSync("secret.key");
var etc_hostname = fs.readFileSync("/etc/hostname");
const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || (/hostwinds/.test(etc_hostname) ? 8040 : 5555);
const itemFields = ["id", "type", "name", "parent { id }", "children { id }", "data", `photos { photo { id filesize colors height id offset width original_name } }`, "users { user { id } }"];
if (!dev && cluster.isMaster) {
  for(let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });
} else {
  const nextApp = next({ dir: ".", dev });
  const nextHandler = nextApp.getRequestHandler();
  nextApp.prepare().then(() => {
    const server = express();
    if(!dev) {
      server.use(function(req, res, next) {
        var proto = req.headers["x-forwarded-proto"];
        if(proto === "https") {
          res.set({
            "Strict-Transport-Security": "max-age=31557600"
          });
          return next();
        }
        res.redirect("https://" + req.headers.host + req.url);
      });
    }
    let sess = {
      secret: typeof secret == "string" ? secret : "the-wild-beauty-1234",
      saveUninitialized: true,
      resave: true,
      cookie: {
        secure: false,
        maxAge: 2160000000,
        httpOnly: false
      },
      expires: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    };

    server.use(cookieParser());

    server.use(
      "/static",
      express.static(path.join(__dirname, "static"), {
        maxAge: dev ? "0" : "365d"
      })
    );

    server.use(
      fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 }
      })
    );

    server.use(bodyParser.json());

    server.use(function(req, res, next) {
      const { query, params, url } = req;
      return next();
    });

    server.post("/api/login", async function(req, res) {
      const { username, password } = req.body;
      try {
        let response = await API.select("users", { username: `"${username}"` }, ["id", "username", "password"]);
        let user = response.users[0];
        let success = user ? bcrypt.compareSync(password, user.password) : false;
        let token,
          user_id = -1;
        if(success) {
          var signature = jwt.sign(password, secret);
          user_id = user.id;
          token = signature.replace(/.*\./g, "");
          last_seen = new Date().toISOString();
          response = await API.update("users", { username: `"${username}"` }, { token, last_seen });
        }
        const cookieOptions = {
          maxAge: 1000 * 60 * 60 * 24,
          httpOnly: false
        };
        res.cookie("token", token, cookieOptions);
        res.cookie("user_id", user_id, cookieOptions);
        res.cookie("username", user.username, cookieOptions);
        if(req.session) {
          req.session.token = token;
          req.session.user_id = user_id;
        }
        user = Util.filterKeys(user, key => key != "password");
        console.error("Login user: ", user);
        res.json({ success, token, user, user_id: user ? user.id : -1 });
      } catch(err) {
        console.error("Login error: ", err);
      }
    });
    const getVar = (req, name) => (req.cookies && req.cookies[name]) || (req.session && req.session[name]);
    const getUser = async function(token, prop) {
      let response = await API.select("users", { token: `"${token}"` }, ["id", "username", "token"]);
      const user = await response.users[0];
      if(user) {
        if(prop) return await user[prop];
        return await user;
      }
      return null;
    };
    const needAuth = fn =>
      async function(req, res) {
        let token = getVar(req, "token");
        if(token) {
          let response = await API.select("users", { token: `"${token}"` }, ["id", "username", "token"]);
          const user = response.users[0];
          if(user) {
            if(token == user.token) return fn(req, res);
          }
        }
        return res.status(401).send("Need authentification");
      };

    server.get("/api/logout", async function(req, res) {
      let token = getVar(req, "token");
      try {
        if(token) {
          let response = await API.select("users", { token: `"${token}"` }, ["id", "username", "token"]);
          const user = response.users[0];
          if(user && token == user.token) {
            response = await API.update("users", { id: user.id }, { token: "NULL" });
            if(req.session) {
              req.session.token = null;
              req.session.user_id = -1;
              req.session.destroy();
            }
            console.log("logout response: ", response);
          }
        }
      } catch(err) {
        console.error("Logout error: ", err);
      }
      res.json({ success: true });
    });

    server.post(
      "/api/put",
      needAuth(async function(req, res) {
        const { filename, data } = req.body;
        var file = fs.openSync(filename, "w");
        var written = fs.writeSync(file, Buffer.from(data, "base64"));
        res.json({ success: written > 0, written });
      })
    );

    server.post("/api/tree/parents", async function(req, res) {
      let { fields, id, ...params } = req.body;
      fields = fields || ["parent { id }", "parent_id", "id"];
      let result = await API(`
        query TreeItem {items(where: {id: {_eq: ${id} }}) {id name type parent_id parent {id name type parent_id parent {id name type parent_id parent {id } } } } }
`);
      let item = result && result.items && result.items[0];
      let list = [];
      for(let node = item; node; node = node.parent) {
        const { id, name, parent_id } = node;
        if(node.id) list.push({ id, parent_id, name });
      }
      res.json({ success: true, parents: [], result });
    });

    server.post("/api/tree", async function(req, res) {
      let { fields, ...params } = req.body;
      fields = fields || itemFields;
      let itemList = await API.list("items", fields.join(" "), params);
      itemList = itemList.map(item => {
        let newData;
        try {
          newData = item && item.data ? JSON.parse(item.data) : {};
        } catch(err) {
          newData = item.data;
        }
        return { ...item, data: newData };
      });
      res.json({ success: true, count: itemList.length, items: itemList });
    });

    server.post("/api/item/new", async function(req, res) {
      let { data, photo_id, parent_id, ...params } = req.body;
      let result = await API.insert(
        "items",
        {
          parent_id,
          photos: `{data: {photo_id: ${photo_id}}}`,
          ...params,
          data: `"${JSON.stringify(data).replace(/"/g, '\\"')}"`
        },
        ["id"]
      );
      if(result && result.insert_items) result = await result.insert_items;
      if(result && result.returning) result = await result.returning;
      res.json({ success: true, result });
    });

    server.post("/api/item*", async function(req, res) {
      let { fields, update, ...params } = req.body;
      let result;
      fields = fields || itemFields;
      if(update) {
        result = await API.update("items", params, update);
        res.json({ success: true, result });
      } else {
        result = await API.select("items", params, fields);
        let itemList = result.items;
        let item = itemList && itemList.length > 0 ? itemList[0] : null;
        console.log("/api/item <= " + util.inspect(result, { depth: 1 }));
        res.json({ success: true, item });
      }
    });

    server.post("/api/image/list", async function(req, res) {
      let { fields, format, ...params } = req.body;
      if(typeof fields == "string") fields = fields.split(/[ ,]\+/g);
      else fields = [];
      let images = await API.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "colors", "user_id", "items { item_id }", ...fields], params);
      if(format == "short") images = images.map(image => `/api/image/get/${image.id}.jpg`);
      if(images.length !== undefined) images = images.filter(im => im.items.length == 0);
      res.json({ success: true, count: images.length, images });
    });

    server.post(
      "/api/image/delete",
      needAuth(async function(req, res) {
        let { id } = req.body;
        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");
        let result = await API.delete("photos", { user_id, id });
        res.json({ success: true, result });
      })
    );

    server.get("/api/image/get/:id", async function(req, res) {
      const id = req.params.id.replace(/[^0-9].*/, "");
      let response = await API(`query PhotoImage { photos(where: {id: {_eq: ${id}}}) { width height offset uploaded id filesize colors data } }`);
      const photo = response.photos[0];
      if(typeof photo == "object") {
        1;
        if(photo.uploaded !== undefined) photo.uploaded = new Date(photo.uploaded).toString();
        let data = Buffer.from(photo.data, "base64");
        delete photo.data;
        res.set("Content-Type", "image/jpeg");
        const { width, height, aspect } = photo;
        let props = { ...(jpeg.jpegProps(data) || {}), width, height, aspect };
        if(props.aspect === undefined) props.aspect = (props.width / props.height).toFixed(3);
        for(let key of ["original_name", "uploaded", "user_id"]) if(photo[key]) props[Util.camelize(key, "-")] = photo[key];
        for(let prop in props) res.set(Util.ucfirst(prop), props[prop]);
        res.send(data);
      }
    });

    server.post(
      "/api/image/upload",
      needAuth(async function(req, res) {
        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");
        let response = [];
        for(let item of Object.entries(req.files)) {
          const file = item[1];

          const dataBuf = Buffer.from(file.data);
          let w = await fsPromises.writeFile("tmp.jpg", dataBuf);
          let metadata = await exifr
            .parse("tmp.jpg")
            .then(exif => console.log("Camera:", exif.Make, exif.Model))
            .catch(console.error);
          let quality = jpegQuality(dataBuf);
          let props = await sharp(file.data).metadata();
          console.error("upload image ", { quality, metadata, props });
          let { width, height, aspect } = props || {};
          if(!aspect && width > 0 && height > 0) aspect = width / height;
          const calcDimensions = (max, props) => {
            if(typeof props != "object" || props === null) props = {};
            let { width, height, ...restOfProps } = props;
            if(width > max || height > max) {
              if(width > height) {
                height = Math.floor((max * height) / width);
                width = max;
              } else {
                width = Math.floor((max * width) / height);
                height = max;
              }
            }
            return { ...restOfProps, width, height };
          };
          const compareDimensions = (a, b) => a.width == b.width && a.height == b.height;
          if(typeof props != "object" || props === null) props = {};
          let size = calcDimensions(maxWidthOrHeight, props);
          if(!compareDimensions(props, size)) {
            if(!size.width) delete size.width;
            if(!size.height) delete size.height;
            let transformer = sharp()
              .jpeg({
                quality: 95
              })
              .resize(size)
              .on("info", function(info) {});
            var inputStream = bufferToStream(file.data);
            var outputStream = new MemoryStream();
            const finished = util.promisify(stream.finished);
            outputStream.on("finish", () => {});
            inputStream.pipe(transformer).pipe(outputStream);
            await finished(outputStream);
            let newData = outputStream.buffer[0];
            file.data = newData;
            props = jpeg.jpegProps(file.data);
            width = size.width ? size.width : props.width;
            height = size.height ? size.height : props.height;
          }
          let data = file.data.toString("base64");
          let word = (file.data[0] << 8) + file.data[1];
          let palette = await getImagePalette(file.data);
          let colors = JSON.stringify(palette).replace(/"/g, '\\"');
          let { depth, channels } = props;
          let reply = await API.insert("photos", { original_name: `"${file.name}"`, colors: `"${colors}"`, filesize: file.data.length, width, height, user_id, data: `"${data}"` }, ["id"]);
          let { affected_rows, returning } = typeof reply == "object" && typeof reply.insert_photos == "object" ? reply.insert_photos : {};
          if(returning && returning.forEach) returning.forEach(({ original_name, filesize, colors, width, height, id }) => response.push({ original_name, filesize, colors, width, height, id }));
        }
        res.json(response);
      })
    );

    server.get("/browse/:category", (req, res) => {
      return nextApp.render(req, res, "/browse", { category: req.params.category });
    });

    server.get("*", (req, res) => {
      res.set({ "Cache-Control": "public, max-age=3600" });
      const parsedUrl = url.parse(req.url, true);
      nextHandler(req, res, parsedUrl);
    });

    server.listen(port, err => {
      if(err) throw err;
    });
  });
}
