const API = require("./utils/api.js");
const Util = require("./utils/util.js");
const fs = require("fs");
const jpeg = require("./utils/jpeg.js");
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
  if(jpeg.isJpeg(buf)) {
    const arr = Uint8Array.from(buf);
    return jpeg.jpegProps(arr);
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
