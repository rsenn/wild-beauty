const fs = require("fs");
const fsPromises = require("fs").promises;

const { loadFile, getImagePalette, imageImport } = require("./imageConversion.js");

(async () => {
  let f = await loadFile("/home/roman/Bilder/OpenCamera/IMG_20190811_233436.jpg");

  console.log("f:", f);

  let img = await imageImport(f);
})();

console.log(loadFile);
