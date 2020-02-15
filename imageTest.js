const fs = require("fs");
const fsPromises = require("fs").promises;
const Util = require("./utils/util.js");

const { loadFile, getImagePalette, imageImport } = require("./imageConversion.js");

(async () => {
  let f = await loadFile("/home/roman/Bilder/OpenCamera/IMG_20190811_233436.jpg");

  //console.log("f:", Util.getMethodNames(f));

  let { data, props, size, exif, palette, colors, ...img } = await imageImport(f);
  console.log(" props, size, exif, palette, colors:", { props, size, exif, palette, colors });
  console.log("img:", img);
})();

console.log(loadFile);
