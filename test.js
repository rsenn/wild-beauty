const API = require("./utils/api.js");
const Util = require("./utils/util.js");
const fs = require("fs");
var fileBuffer = fs.readFileSync("static/img/63a5110bf12b0acef2f68e0e1a023502.jpg");
/*
console.log(fileBuffer);
console.log(fileBuffer.length);*/

const insertItem = ({ id, image, author }) => {
  return `mutation InsertItem {
    __typename
    insert_items(objects: {id: ${id}, author: "${author}", image: "${fileBuffer.toString("base64")}"}) {
      affected_rows
      returning {
        author
        id
        image
      }
    }
  }`;
};
const queryItems = () => {
  return `query ListItems {
 items {
   id
  image
  author
 }
}`;
};

const api = API();
let res;
res = api.insert("items", { id: 46, image: "x.jpg", author: "mister x" });
res.then(res => {
  const items = res.data && res.data.insert_items ? res.data.insert_items.returning : [];
  for(let item of items) {
    console.log("Inserted item: ", item);
  }

  //console.log("res: ", res.data);
});

const isJpeg = buf => (typeof(buf) == 'object' && buf !== null && buf.length >= 10) ? buf.readUInt32LE(6) == 0x4649464a : false;


function jpegProps(data) {
  var ret = {};
  // data is an array of bytes
  var off = 0;
  while(off < data.length) {
    while(data[off] == 0xff) off++;
    var mrkr = data[off];
    off++;
    if(!((mrkr & 0xf0) == 0xc0)) {
      if(mrkr == 0xd8) continue; // SOI
      if(mrkr == 0xd9) break; // EOI
      if(0xd0 <= mrkr && mrkr <= 0xd7) continue;
      if(mrkr == 0x01) continue; // TEM
    }
    var len = (data[off] << 8) | data[off + 1];
    off += 2;
    if((mrkr & 0xf0) == 0xc0) {
      ret = {
        depth: data[off]* data[off + 5], // precission (bits per channel)
        width: (data[off + 1] << 8) | data[off + 2],
        height: (data[off + 3] << 8) | data[off + 4],
        channels: data[off + 5] // number of color components
      };
      break;
    }

    off += len - 2;
  }
  if(ret.depth === undefined) return null;
  return ret;
}

const convertImage = item => {
  var ret = null;
  var buf = Buffer.from(item.image, "base64");

  if(/\.jpe?g$/.test(item.image)) {
    try {
      buf = fs.readFileSync(item.image);
    } catch(err) {
      return item.image;
    }
  }
  if(isJpeg(buf)) {
    const arr = Uint8Array.from(buf);
    return jpegProps(arr);
  }
  return null;
};

res = api.list("items", "author,image");
res.then(res => {
  const items = res.map(item => ({
    ...item,
    image: convertImage(item)
  }));
  /*  console.log("res: ", items);
   */
  for(let item of items) {
    console.log("Item: ", item);
  }
  // items.forEach(console.log);
});
