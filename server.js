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

var multer = require("multer");
var cloudinary = require("cloudinary");
var cloudinaryStorage = require("multer-storage-cloudinary");

var secret = fs.readFileSync("secret.key");

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
});
// The root provides a resolver function for each API endpoint
var rootValue = {
  items: ({ id, author, image }) => {
    console.log("item: ", { id, author, image });
  },
  users: ({ id, name, email, password, last_seen }) => {
    console.log("user: ", { id, name, email, password, last_seen });
  },
  photos: ({ id, src, width, height }) => {
    console.log("photo: ", { id, author, image });
  }
};

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 5555;

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

// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  console.log(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for(let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`
    );
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
    server.use(
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
    );
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
        let token, user_id = -1;
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

    server.post("/api/upload", function(req, res) {
      /*   if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
*/
      const file = req.files.file;
      const data = file.data.toString("base64");
      const props = jpeg.jpegProps(Uint8Array.from(file.data));
      const { width, height } = props;
      API.insert("photos", { data, filesize: file.data.length, width, height });
      console.log("API upload photo: ", props);
      //
      //      const q = "{ images {id image author } }";
      //      graphql.graphql(schema, "{ id image author }").then(result => {
      //        // Prints
      //        // {
      //        //   data: { hello: "world" }
      //        // }
      //        console.log(result);
      //      });
      //      /*      graphql.graphql(schema, insertItem({ id: 30, author: "x", image: "x.jpg" })).then(result => {
      //        console.log(result);
      //      });*/
    });
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
