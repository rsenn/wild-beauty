const express = require("express");
const next = require("next");
const path = require("path");
const url = require("url");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const graphqlHTTP = require("express-graphql");
const graphql = require("graphql");
const API = require("./utils/api.js")();
const jpeg = require("./utils/jpeg.js");
const Util = require("./utils/util.js");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
var cookieParser = require("cookie-parser");
const sharp = require("sharp");
const util = require("util");
var session = require("express-session");
var cookieSession = require("cookie-session");
const maxWidthOrHeight = 1024;
var MemoryStream = require("memory-stream");
let stream = require("stream");
let Readable = stream.Readable;

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.depth = 10;

function bufferToStream(buffer) {
  let stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
/*
var multer = require("multer");
var cloudinary = require("cloudinary");
var cloudinaryStorage = require("multer-storage-cloudinary");
*/
var secret = fs.readFileSync("secret.key");
/*
const userType = new graphql.GraphQLObjectType({
  name: "users",
  fields: {
    id: { type: graphql.GraphQLInt },
    name: { type: graphql.GraphQLString },
    password: { type: graphql.GraphQLString },
    last_seen: { type: graphql.GraphQLString }
  }
});
const itemType = new graphql.GraphQLObjectType({
  name: "items",
  fields: {
    id: { type: graphql.GraphQLInt },
    author: { type: userType },
    image: { type: graphql.GraphQLString }
  }
});
const photoType = new graphql.GraphQLObjectType({
  name: "photos",
  fields: {
    id: { type: graphql.GraphQLInt },
    src: { type: graphql.GraphQLString },
    width: { type: graphql.GraphQLInt },
    height: { type: graphql.GraphQLInt }
  }
});
var schema = new graphql.GraphQLSchema({
  query: itemType,
  mutation: new graphql.GraphQLObjectType({
    //⚠️ NOT mutiation
    name: "Mutation",
    fields: () => ({
      incrementCounter: {
        type: graphql.GraphQLInt,
        resolve: () => ++counter
      }
    })
  })
});*/
// The root provides a resolver function for each API endpoint
/*var rootValue = {
  items: ({ id, author, image }) => {
    //console.log("item: ", { id, author, image });
  },
  users: ({ id, name, email, password, last_seen }) => {
    //console.log("user: ", { id, name, email, password, last_seen });
  },
  photos: ({ id, src, width, height }) => {
    //console.log("photo: ", { id, author, image });
  }
};*/
const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 5555;
/*
const insertItem = ({ id, image, author }) => {
  return `mutation Mutation {
  __typename
  insert_items(objects: {id: ${id}, author: "${author}", image: "${image}"}) {
    affected_rows
    returning {
      author
      id
      image
    }
  }
}`;
};
var ret = API.insert('users', { name: 'test2' });
ret.then(ret => {
  //console.log(ret);
});
*/
// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  //console.log(`Node cluster master ${process.pid} is running`);
  // Fork workers.
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
      // Enforce SSL & HSTS in production
      server.use(function(req, res, next) {
        var proto = req.headers["x-forwarded-proto"];
        if(proto === "https") {
          res.set({
            "Strict-Transport-Security": "max-age=31557600" // one-year
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
    //server.use(session(sess));
    server.use(cors({ credentials: true }));
    server.use(cookieParser());

    // Static files
    // https://github.com/zeit/next.js/tree/4.2.3#user-content-static-file-serving-eg-images
    server.use(
      "/static",
      express.static(path.join(__dirname, "static"), {
        maxAge: dev ? "0" : "365d"
      })
    );
    /*   server.use(
      "https://wild-beauty.herokuapp.com/v1/graphql",
      graphqlHTTP({
        schema: schema,
        graphiql: true,
        rootValue
      })
    );
    server.use(
      "https://wild-beauty.herokuapp.com/v1/graphql",
      graphqlHTTP(request => {
        return {
          schema: schema,
          context: { startTime: Date.now() },
          graphiql: true,
          rootValue
        };
      })
    );*/
    server.use(
      fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 }
      })
    );
    server.use(bodyParser.json());

    server.use(function(req, res, next) {
      const token = getVar(req, "token");
      const user_id = getVar(req, "user_id");
      //console.log("Cookie: ", { token, user_id });

      return next();
    });

    server.post("/api/login", async function(req, res) {
      const { username, password } = req.body;
      ////console.log("req: ", { username, password });
      try {
        let response = await API.select("users", { username }, ["id", "username", "password"]);
        let user = response.users[0];
        let success = user ? bcrypt.compareSync(password, user.password) : false;
        let token,
          user_id = -1;
        if(success) {
          var signature = jwt.sign(password, secret);
          user_id = user.id;
          token = signature.replace(/.*\./g, "");
          last_seen = new Date().toISOString();
          response = await API.update("users", { username }, { token, last_seen });
        }
        const cookieOptions = {
          maxAge: 1000 * 60 * 60 * 24, // 1 day
          httpOnly: false // http only, prevents JavaScript cookie access
        };
        res.cookie("token", token, cookieOptions);
        res.cookie("user_id", user_id, cookieOptions);

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
      let response = await API.select("users", { token }, ["id", "username", "token"]);
      const user = await response.users[0];
      console.log("getUser: response =", response);

      if(user) {
        if(prop) return await user[prop];
        return await user;
      }

      return null;
    };
    const needAuth = fn =>
      async function(req, res) {
        let token = getVar(req, "token");
        console.log("needAuth: ", { token });

        if(token) {
          let response = await API.select("users", { token }, ["id", "username", "token"]);
          const user = response.users[0];
          console.log("needAuth: response =", response);

          if(user) {
            if(token == user.token) return fn(req, res);
          }
        }
        //    res.json({ success: false, message: 'Need authentification' });
        return res.status(401).send("Need authentification");
      };

    server.get("/api/logout", async function(req, res) {
      let token = getVar(req, "token");
      try {
        if(token) {
          let response = await API.select("users", { token }, ["id", "username", "token"]);
          const user = response.users[0];
          //console.log("req.cookies.token: ", req.cookies.token, ", user.token: ", user.token);
          if(user && token == user.token) {
            response = await API.update("users", { id: user.id }, { token: "NULL" });

            if(req.session) {
              req.session.token = null;
              req.session.user_id = -1;
              req.session.destroy();
            }
            ////console.log("response: ", response.affected_rows);
            return res.json({ success: !!(response && response.affected_rows) });
          }
        }
      } catch(err) {
        console.error("Logout error: ", err);
      }
      res.json({ success: false });
    });

    server.post("/api/item/tree", async function(req, res) {
      let { fields, ...params } = req.body;
      if(!fields) fields = ["id", "type", "parent { id }", "children { id }", "data", "photos { photo { id } }", "users { user { id } }"];
      console.log("params: ", params);
      let itemList = await API.list("items", fields, params);
      itemList = itemList.map(item => {
        let newData;
        try {
          newData = JSON.parse(item.data);
        } catch(err) {
          newData = item.data;
        }
        return { ...item, data: newData };
      });
      console.log("itemList: ", itemList);
      /*    let items = {};
      itemList.forEach(item => {
        item.data = JSON.parse(item.data);
        items[parseInt(item.id)] = item;
      });*/
      res.json({ success: true, count: itemList.length, items: itemList });
    });

    server.post("/api/item/new", async function(req, res) {
      let { data, parent_id, ...params } = req.body;
      console.log("params: ", params);
      let result = await API.insert("items", { parent_id, ...params, data: (typeof data == "string" ? data : JSON.stringify(data)).replace(/"/g, '\\"') }, ["id"]);
      console.log("result: ", result);
      if(result && result.insert_items) result = await result.insert_items;
      if(result && result.returning) result = await result.returning;
      res.json({ success: true, result });
    });

    //   server.use(bodyParser.json());
    //  curl   --header 'Content-Type: application/json' --data '{"fields":"original_name","offset":"10","limit":"10","order_by":"{id: desc}"}' -v http://localhost:5555/api/image/list|json_pp
    server.post("/api/image/list", async function(req, res) {
      let { fields, format, ...params } = req.body;
      if(typeof fields == "string") fields = fields.split(/[ ,]\+/g);
      else fields = [];
      //console.log("params: ", params);
      let images = await API.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "user_id", "items { id }", ...fields], params);
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
      //console.log(`id: `, id);
      let response = await API.select("photos", { id }, ["id", "original_name", "data", "width", "height", "uploaded", "filesize", "user_id"]);
      const photo = response.photos[0];
      photo.uploaded = new Date(photo.uploaded).toString();
      let data = Buffer.from(photo.data, "base64");
      delete photo.data;
      //console.log(`photo: `, photo);
      res.set("Content-Type", "image/jpeg");
      const { width, height, aspect } = photo;
      let props = { ...(jpeg.jpegProps(data) || {}), width, height, aspect };

      if(props.aspect === undefined) props.aspect = (props.width / props.height).toFixed(3);
      for(let key of ["original_name", "uploaded", "user_id"]) if(photo[key]) props[Util.camelize(key, "-")] = photo[key];
      for(let prop in props) res.set(Util.ucfirst(prop), props[prop]);
      res.send(data);
    });

    server.post(
      "/api/image/upload",
      needAuth(async function(req, res) {
        /*   if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }*/

        let user_id = getVar(req, "user_id") || getUser(getVar(req, "token"), "id");

        //  //console.log(`Files: `, Object.entries(req.files));
        let response = [];
        for(let item of Object.entries(req.files)) {
          const file = item[1];
          //console.log(`item: `, item);
          //const data = ;
          let props = await sharp(file.data).metadata(); // jpeg.jpegProps(file.data);
          console.log(`props: `, props);

          let { width, height, aspect } = props || {};
          if(!aspect && width > 0 && height > 0) aspect = width / height;
          console.log(`Image width: ${width} height: ${height}`);
          //console.log(`Image aspect: ${aspect}`);
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
          let newDimensions = calcDimensions(maxWidthOrHeight, props);
          console.log(`New Image width: ${newDimensions.width} height: ${newDimensions.height}`);

          if(!compareDimensions(props, newDimensions)) {
            //console.log(`new Image aspect: ${aspect}`);
            if(!newDimensions.width) delete newDimensions.width;
            if(!newDimensions.height) delete newDimensions.height;
            console.log(`newDimensions `, newDimensions);
            const transformer = sharp()
              .jpeg({
                quality: 95 /*,
              chromaSubsampling: "4:4:4"*/
              })
              .resize(newDimensions)
              .on("info", function(info) {
                //console.log("Image height is " + info.height);
              });
            var inputStream = bufferToStream(file.data);
            var outputStream = new MemoryStream();
            const finished = util.promisify(stream.finished);
            outputStream.on("finish", () => {
              //console.log("outputStream: ", outputStream.buffer);
            });
            //console.log("inputStream: ", inputStream);
            inputStream.pipe(transformer).pipe(outputStream);
            await finished(outputStream);
            let newData = outputStream.buffer[0];
            //let img = await sharp(file.data).resize(newDimensions.width, newDimensions.height).toBuffer();
            //console.log("newData.length: ", newData.length);
            file.data = newData;
            props = jpeg.jpegProps(file.data);
            width = newDimensions.width ? newDimensions.width : props.width;
            height = newDimensions.height ? newDimensions.height : props.height;
            //console.log(`new Image props: `, props);
          }
          /*.resize*/
          let data = file.data.toString("base64");
          let word = (file.data[0] << 8) + file.data[1];
          const { depth, channels } = props;
          let reply = await API.insert("photos", { data, original_name: file.name, filesize: file.data.length, width, height, user_id }, ["id"]);
          console.log("API upload photo: ", reply && reply.returning ? reply.returning : reply);
          const { affected_rows, returning } = typeof reply == "object" && typeof reply.insert_photos == "object" ? reply.insert_photos : {};
          console.log("API upload photo: ", word.toString(16), { affected_rows, props });
          if(returning && returning.forEach) returning.forEach(({ original_name, filesize, width, height, id }) => response.push({ original_name, filesize, width, height, id }));
        }
        //console.log("Send response: ", response);
        res.json(response);
      })
    );

    // Example server-side routing
    server.post("/a", (req, res) => {
      return nextApp.render(req, res, "/b", req.query);
    });
    // Example server-side routing
    server.get("/b", (req, res) => {
      return nextApp.render(req, res, "/a", req.query);
    });
    // Default catch-all renders Next app
    server.get("*", (req, res) => {
      // res.set({
      //   'Cache-Control': 'public, max-age=3600'
      // });
      const parsedUrl = url.parse(req.url, true);
      nextHandler(req, res, parsedUrl);
    });
    server.listen(port, err => {
      if(err) throw err;
      //console.log(`Listening on http://localhost:${port}`);
    });
  });
}
