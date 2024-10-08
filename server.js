const express = require("express");
const next = require("next");
const path = require("path");
const url = require("url");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const jpeg = require("./lib/jpeg.cjs");
const Util = require("./lib/util.cjs");
const getAPI = require("./stores/api.cjs").getAPI;
const dom = require("./lib/dom.cjs");
const { RGBA, HSLA } = dom;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const util = require("util");
const stream = require("stream");
const Alea = require("./lib/alea.cjs");
const Readable = stream.Readable;
//const tempfile = require("tempfile");
const fsPromises = require("fs").promises;
const { loadFile, getImagePalette, imageImport, rotatePhoto } = require("./imageConversion.js");
const { isJpeg, jpegProps } = require("./lib/jpeg.cjs");
const { Console } = require("console");
const { stdout, stderr } = process;
const sha1 = require("node-sha1");
const { PassThrough, Writable } = require("stream");

function logStream(file) {
  var output = [process.stdout];
  if(file) {
    let s = fs.createWriteStream(file, { flags: "a" });
    output.push(s);
  }
  let ret = new Writable({
    objectMode: true,
    write: (data, encoding, callback) => {
      output.forEach(o => o.write(data));
      callback();
    }
  });
  return ret;
}

var log = logStream("server.log");

global.console = new Console({ stdout: log, stderr: log, inspectOptions: { depth: 10, colors: true } });

const API = getAPI("http://127.0.0.1:8080/v1/graphql", { secret: "RUCXOZZjwWXeNxOOzNZBptPxCNl18H" });
API.options.debug = true;

var secret = fs.readFileSync("secret.key");
var etc_hostname = fs.readFileSync("/etc/hostname");
const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || (/hostwinds/.test(etc_hostname) ? 8040 : 5555);
const itemFields = ["id", "type", "name", "parent { id }", "children { id }", "data", `photos { photo { id filesize colors height id offset width original_name } }`, "users { user { id } }"];
if(!dev && cluster.isMaster) {
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
      server.use(function (req, res, next) {
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

    server.use(function (req, res, next) {
      const { query, params, url } = req;
      return next();
    });

    server.post("/api/login", async (req, res) => {
      console.log("/api/login", { body: req.body });
      const { username, password } = req.body;
      try {
        let response = await API.select("users", { username: `"${username}"` }, ["id", "username", "password"]);
        console.log("/api/login", { response });
        let user = response.users[0];
        let success = user ? bcrypt.compareSync(password, user.password) : false;
        let token,
          user_id = -1;
        if(success) {
          var signature = jwt.sign(password, secret);
          user_id = user.id;
          token = signature.replace(/.*\./g, "");
          last_seen = new Date().toISOString();
          response = await API.update("users", { username /*: `"${username}"`*/ }, { token, last_seen });
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
        delete user.password;
        //user = Util.filterKeys(user, key => key != "password");

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
    const needAuth = fn => async (req, res) => {
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

    server.get("/api/logout", async (req, res) => {
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
      needAuth(async (req, res) => {
        const { filename, data } = req.body;
        var file = fs.openSync(filename, "w");
        var written = fs.writeSync(file, Buffer.from(data, "base64"));
        res.json({ success: written > 0, written });
      })
    );

    server.post("/api/tree/parents", async (req, res) => {
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

    server.post("/api/tree", async (req, res) => {
      let { fields, ...params } = req.body;
      fields = fields || itemFields;
      let itemList = await API.list("items", fields.join(" "), { order_by: "{parent_id: asc, order: asc, created: asc}", ...params });
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

    server.post("/api/item/new", async (req, res) => {
      let { data, photo_id, parent_id, ...params } = req.body;
      let result = await API.insert(
        "items",
        {
          parent_id,
          photos: `{data: {photo_id: ${photo_id}}}`,
          ...params,
          data: `"${data.replace(/"/g, '\\"')}"`
        },
        ["id"]
      );
      if(result && result.insert_items) result = await result.insert_items;
      if(result && result.returning) result = await result.returning;
      res.json({ success: true, result });
    });

    server.post("/api/item*", async (req, res) => {
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

    server.post(
      "/api/photo/rotate",
      needAuth(async (req, res) => {
        let { id, angle } = req.body;
        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");

        angle = angle ? parseFloat(angle) : 90;

        let response = await API(`query PhotoImage { photos(where: {id: {_eq: ${id}}}) { id width height offset filesize data user_id } }`);
        const photo = response.photos[0];

        if(typeof photo == "object") {
          if(user_id == photo.user_id) {
            let input = Buffer.from(photo.data, "base64");
            delete photo.data;
            let rotated = await rotatePhoto(input, angle);
            let { data, width, height } = await rotated;
            console.log("rotate", { width, height });
            let result = await API.update("photos", { id }, { data, width, height });
            res.json({ success: true, width, height, id, angle });
          } else {
            res.json({ success: false, error: `Photo is not owned by user (id: ${user_id})` });
          }
        }
      })
    );

    server.post("/api/photo/list", async (req, res) => {
      let { fields, format, ...params } = req.body;
      if(typeof fields == "string") fields = fields.split(/[ ,]\+/g);
      else fields = [];
      let images = await API.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "colors", "user_id", "items { item_id }", ...fields], params);
      if(format == "short") images = images.map(image => `/api/photo/get/${image.id}.jpg`);
      if(images.length !== undefined) images = images.filter(im => im.items.length == 0);
      res.json({ success: true, count: images.length, images });
    });

    server.post(
      "/api/photo/delete",
      needAuth(async (req, res) => {
        let { id } = req.body;
        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");
        let result = await API.delete("photos", { user_id, id });
        res.json({ success: true, result });
      })
    );

    server.get("/api/photo/get/:id", async (req, res) => {
      const id = req.params.id.replace(/[^0-9].*/, "");
      let response = await API(`query PhotoImage { photos(where: {id: {_eq: ${id}}}) { offset uploaded id filesize colors data } }`);
      const photo = response.photos[0];
      if(typeof photo == "object") {
        1;
        if(photo.uploaded !== undefined) photo.uploaded = new Date(photo.uploaded).toString();
        let data = Buffer.from(photo.data, "base64");
        delete photo.data;
        res.set("Content-Type", "image/jpeg");
        // const { aspect } = photo;
        let { width, height } = jpegProps(data);
        let aspect = width / height;
        let props = { width, height, aspect };

        for(let key of ["original_name", "uploaded", "user_id"]) if(photo[key]) props[Util.camelize(key, "-")] = photo[key];
        for(let prop in props) res.set(Util.ucfirst(prop), props[prop]);
        res.send(data);
      }
    });

    server.post(
      "/api/photo/upload",
      needAuth(async (req, res) => {
        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");
        let response = [];
        for(let item of Object.entries(req.files)) {
          const file = item[1];
          const image = await imageImport(file.data);
          const original_sha1 = sha1(file.data);
          let { colors, palette, data, size, props, exif } = image;
          let { width, height } = size;
          /*if(typeof exif == "object" && exif !== null)
            exif = Object.fromEntries(
              Object.entries(exif)
                .filter(([key, value]) => !(value instanceof Buffer))
                .map(([key, value]) => [key, Util.isDate(value) ? Util.toUnixTime(Util.parseDate(value)) : value])
            );*/
          let exifData = JSON.stringify(exif);
         console.log("file upload: ", { item, exifData,exif });
          let reply = {};
          const photo = {
            exif: exifData && `"${exifData.replace(/[\\"]/g, "\\$&")}"`,
            original_sha1: `"${original_sha1}"`,
            original_name: `"${file.name}"`,
            colors: `"${colors}"`,
            filesize: file.data.length,
            width,
            height,
            user_id,
            data: `"${data}"`
          };
          reply = { ...reply, original_name: file.name };
          try {
            response = await API.insert("photos", photo, ["id"]);
            console.log("photo/upload ", Util.filterOutKeys(photo, ["data"]), " response=", response);
            let { affected_rows, returning } = typeof response == "object" && typeof response.insert_photos == "object" ? response.insert_photos : {};
            //if(returning && returning.forEach) returning.forEach(({ original_name, filesize, colors, width, height, exif, id }) => response.push({ original_name, filesize, colors, width, height, id }));
            reply = { ...reply, affected_rows, returning };
          } catch(error) {
            if(typeof error == "string") error = error.replace(/^([^\n]*)\n.*/g, "$1");
            console.log("ERROR:", error);
            API.options.debug = true;
            response = await API.select("photos", { original_sha1: `"${original_sha1}"` }, ["id", "width", "height", "original_name", "original_sha1", "colors", "filesize", "exif"]);
            API.options.debug = false;
            let photo;
            if(response && response.photos && response.photos.length) photo = response.photos[0];
            delete response.photos;
            console.log("photo/upload response:", response);
            reply = { ...reply, error, photo };
          }
          //   console.log("reply:", reply);
          res.json(reply);
        }
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
