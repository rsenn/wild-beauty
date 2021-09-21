const withCSS = require("@zeit/next-css");
require("dotenv").config();
const path = require("path");
const Dotenv = require("dotenv-webpack");

const withImages = require("next-images");

module.exports = withCSS(
  withImages({
    //assetPrefix: 'http://transistorisiert.ch:6200/',
    assetPrefix: "https://transistorisiert.ch/wb/",
    basePath: "/wb",
    inlineImageLimit: 16384,
    webpack(config, options) {
      config.node = {
        module: "empty",
        fs: "empty",
        child_process: "empty",
        net: "empty",
        dns: "empty",
        tls: "empty"
      };
      config.plugins = config.plugins || [];
      config.plugins = [
        ...config.plugins,

        // Read the .env file
        new Dotenv({
          path: path.join(__dirname, ".env"),
          systemvars: true
        })
      ];
      return config;
    }
  })
);
