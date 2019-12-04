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
    insert_items(objects: {id: ${id}, author: "${author}", image: "${fileBuffer.toString(
    "base64"
  )}"}) {
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
res = api.insert("items", { id: 44, image: "x.jpg", author: "mister x" });
res.then(res => {
  if(res.data.data !== undefined) res.data = res.data.data;

  const items = res.data && res.data.insert_items ? res.data.insert_items.returning : [];
  for(let item of items) {
    console.log(/*JSON.stringify*/ item);
  }

  console.log("res: ", res.data);
});

res = api(queryItems());
res.then(res => {
  const items = res.data.data.items.map(item => Util.filterKeys(item, key => key != "image"));
  console.log("res.data: ");

  for(let item of items) {
    console.log(/*JSON.stringify*/ item);
  }
});
