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
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
var cookieParser = require("cookie-parser");
const sharp = require("sharp");
const util = require("util");

const maxWidthOrHeight = 1024;

var MemoryStream = require("memory-stream");

let stream = require("stream");
let Readable = stream.Readable;
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
    console.log("item: ", { id, author, image });
  },
  users: ({ id, name, email, password, last_seen }) => {
    console.log("user: ", { id, name, email, password, last_seen });
  },
  photos: ({ id, src, width, height }) => {
    console.log("photo: ", { id, author, image });
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
var ret = API.insert("users", { name: "test2" });
ret.then(ret => {
  console.log(ret);
});
*/
// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  console.log(`Node cluster master ${process.pid} is running`);

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
    server.use(cors());
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

    server.post("/api/login", async function(req, res) {
      const { username, password } = req.body;
      //console.log("req: ", { username, password });
      try {
        let response = await API.select("users", { username }, ["id", "username", "password"]);
        const user = response.users[0];
        let success = bcrypt.compareSync(password, user.password);
        let token,
          user_id = -1;
        if(success) {
          user_id = user.id;

          token = jwt.sign(password, secret);
          last_seen = new Date().toISOString();
          response = await API.update("users", { username }, { token, last_seen });
        }
        res.cookie("token", token, {
          maxAge: 1000 * 60, // 1 min
          httpOnly: true // http only, prevents JavaScript cookie access
        });
        console.error("Login user: ", user);

        res.json({ success, token, user_id: user.id });
      } catch(err) {
        console.error("Login error: ", err);
      }
    });

    const needAuth = fn =>
      async function(req, res) {
        if(req.cookies && req.cookies.token) {
          const { token } = req.cookies;
          let response = await API.select("users", { token }, ["id", "username", "token"]);
          const user = response.users[0];
          //console.log("req.cookies.token: ", req.cookies.token, ", user.token: ", user.token);
          if(req.cookies.token == user.token) return fn(req, res);
        }
        //    res.json({ success: false, message: 'Need authentification' });
        return res.status(401).send("Need authentification");
      };

    server.get("/api/logout", async function(req, res) {
      try {
        if(req.cookies && req.cookies.token) {
          const { token } = req.cookies;
          let response = await API.select("users", { token }, ["id", "username", "token"]);
          const user = response.users[0];
          //console.log("req.cookies.token: ", req.cookies.token, ", user.token: ", user.token);
          if(req.cookies.token == user.token) {
            response = await API.update("users", { id: user.id }, { token: "NULL" });
            //console.log("response: ", response.affected_rows);
            if(response.affected_rows == 1) {
              res.json({ success: true });
              return;
            }
          }
        }
      } catch(err) {
        console.error("Logout error: ", err);
      }
      res.json({ success: false });
    });

    server.get("/api/image/:id", async function(req, res) {
      console.log(`req: `, req);
    });

    server.post(
      "/api/upload",
      needAuth(async function(req, res) {
        /*   if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
*/
        console.log(`Files: `, Object.entries(req.files));

        let response = [];

        for(let item of Object.entries(req.files)) {
          const file = item[1];
          console.log(`item: `, item);
          console.log(`file: `, file);

          //const data = ;
          let props = jpeg.jpegProps(Uint8Array.from(file.data));
          let { width, height } = props;
          let aspect = width / height;
          console.log(`Image width: ${width} height: ${height}`);
          console.log(`Image aspect: ${aspect}`);

          const calcDimensions = (max, { width, height }) => {
            if(width > max || height > max) {
              if(width > height) {
                height = Math.floor((max * height) / width);
                width = max;
              } else {
                width = Math.floor((max * width) / height);
                height = max;
              }
            }
            return { width, height };
          };

          const compareDimensions = (a, b) => a.width == b.width && a.height == b.height;

          let newDimensions = calcDimensions(maxWidthOrHeight, { width, height });
          aspect = newDimensions.width / newDimensions.height;

          if(!compareDimensions({ width, height }, newDimensions)) {
            console.log(`new Image aspect: ${aspect}`);
            console.log(`newnewDimensions `, newDimensions);

            const transformer = sharp()
              .jpeg({
                quality: 95 /*,
              chromaSubsampling: "4:4:4"*/
              })
              .resize(newDimensions)
              .on("info", function(info) {
                console.log("Image height is " + info.height);
              });

            var inputStream = bufferToStream(file.data);

            var outputStream = new MemoryStream();
            const finished = util.promisify(stream.finished);

            outputStream.on("finish", function() {
              console.log("outputStream: ", outputStream.buffer);
            });
            console.log("inputStream: ", inputStream);

            inputStream.pipe(transformer).pipe(outputStream);

            await finished(outputStream);

            let newData = outputStream.buffer[0];
            //let img = await sharp(file.data).resize(newDimensions.width, newDimensions.height).toBuffer();

            console.log("newData.length: ", newData.length);

            file.data = newData;

            props = jpeg.jpegProps(Uint8Array.from(file.data));
            width = props ? props.width : null;
            height = props ? props.height : null;
            console.log(`new Image props: `, { width, height });
          }

          /*

.resize*/
          let data = file.data.toString("base64");
          let word = file.data[0] << (8 + file.data[1]);

          let reply = await API.insert("photos", { data, original_name: file.name, filesize: file.data.length, width, height }, ["id"]);

          const { affected_rows, returning } = reply.insert_photos;
          console.log("API upload photo: ", word.toString(16), { affected_rows, props });

          returning.forEach(({ original_name, filesize, width, height, id }) => response.push({ original_name, filesize, width, height, id }));
        }
        console.log("Send response: ", response);
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
      console.log(`Listening on http://localhost:${port}`);
    });
  });
}
