const express = require("express");
const next = require("next");
const path = require("path");
const url = require("url");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 5555;

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

    // Static files
    // https://github.com/zeit/next.js/tree/4.2.3#user-content-static-file-serving-eg-images
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

    server.post("/api/upload", function(req, res) {
      /*   if(!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
*/
      const file = req.files.file;
      const data = file.data.toString("base64");
      console.log("API upload: ", data.slice(0, 32)); // the uploaded file object
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
