const exifr = require("exifr");
const fsPromises = require("fs").promises;
const jpegQuality = require("jpegquality");
const jpeg = require("./lib/jpeg.js");
const Util = require("./lib/util.js");
const MemoryStream = require("memory-stream");
const sharp = require("sharp");
const stream = require("stream");
const readableStream = stream.Readable;
const util = require("util");
const cquant = require("cquant");
const dom = require("./lib/dom.js");
const { PassThrough, Writable } = require("stream");
const { RGBA, HSLA } = dom;
const maxWidthOrHeight = 1024;

function bufferToStream(buffer) {
  let stream = new readableStream();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const createMemoryStream = () => {
  let memory = new MemoryStream();
  let stream = new Writable({
    write(chunk, encoding, callback) {
      console.log(`writing ${chunk.length} bytes`);
      memory.write(chunk, encoding);
      callback();
    }
  });
  stream.buffer = memory.buffer;
  return stream;
};

async function loadFile(path) {
  let data = await fsPromises.readFile(path);

  return data;
}

async function getImagePalette(data) {
  const getImageColors = data =>
    new Promise((resolve, reject) => {
      let img = sharp(data);
      img.raw().toBuffer((_err, buffer, info) => {
        if(!_err) {
          let colorCount = 16;
          cquant
            .paletteAsync(buffer, info.channels, colorCount)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  let ret = await getImageColors(data);
  return Object.fromEntries(
    [...ret].map(c => {
      let color = new RGBA(c.R, c.G, c.B, 255);
      return [color.hex(), c.count];
    })
  );
}

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

const imageImporter = maxWidthOrHeight =>
  async function imageImport(inputBuf) {
    const dataBuf = Buffer.from(inputBuf);
    let w = await fsPromises.writeFile("tmp.jpg", dataBuf);
    let output, size, quality, props;
    let exif = await exifr.parse("tmp.jpg");
    //console.log("exif: ", exif);
    quality = jpegQuality(dataBuf);
    props = await sharp(inputBuf).metadata();
    let { width, height, aspect } = props || {};
    if(!aspect && width > 0 && height > 0) aspect = width / height;

    console.error("upload image ", { quality, width, height, aspect });

    if(typeof props != "object" || props === null) props = {};
    size = calcDimensions(maxWidthOrHeight, props);
    if(!compareDimensions(props, size)) {
      if(!size.width) delete size.width;
      if(!size.height) delete size.height;
      let transformer = sharp()
        .jpeg({
          quality: 95
        })
        .resize(size)
        .on("info", function(info) {});
      var inputStream = bufferToStream(Buffer.from(inputBuf));
      //console.log("inputBuf:", inputBuf.length);
      //  console.log("inputStream:",inputStream, Util.members(inputStream));
      var outputStream = createMemoryStream();
      const finished = util.promisify(stream.finished);
      outputStream.on("finish", () => {});
      inputStream.pipe(transformer).pipe(outputStream);
      await finished(outputStream);
      output = outputStream.buffer[0];
      //console.log("output:", output.length);
      props = jpeg.jpegProps(output);
      width = size.width ? size.width : props.width;
      height = size.height ? size.height : props.height;
      //console.log("output:", output);
    }
    let data = output.toString("base64");
    //console.log("data:", data.substring(0, 100));
    let word = (output[0] << 8) + output[1];
    let palette = await getImagePalette(output);
    let colors = JSON.stringify(palette).replace(/"/g, '\\"');
    //console.log("ret:", { word, palette, colors });
    let { depth, channels } = props;
    return { data, size, palette, colors, exif, props };
  };

const imageImport = imageImporter(maxWidthOrHeight);

const rotatePhoto = async (inputBuf, angle) => {
  var inputStream = bufferToStream(Buffer.from(inputBuf));
  var outputStream = new MemoryStream();
  const finished = util.promisify(stream.finished);
  outputStream.on("finish", () => {});

  let transformer = sharp()
    .jpeg({ quality: 100 })
    .rotate(angle);

  inputStream.pipe(transformer).pipe(outputStream);
  await finished(outputStream);
  var output = outputStream.buffer[0];

  var props = jpeg.jpegProps(output);
  const { width, height } = props;

  let data = output.toString("base64");

  return { data, width, height };
};

if(module) {
  module.exports = {
    loadFile,
    getImagePalette,
    imageImporter,
    imageImport,
    rotatePhoto
  };
}
