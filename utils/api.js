const axios = require("axios");
const Util = require("./util.js");

function API() {
  const url = "http://wild-beauty.herokuapp.com/v1/graphql";
  var api = async function(query) {
    let res = await axios({
      url,
      method: "POST",
      headers: {
        "Accept-Encoding": "deflate, br;q=1.0, gzip;q=0.9, *;q=0.5"
      },
      data: JSON.stringify({ query }),
      responseType: "blob"
    });
    //console.log("res: ", res);

    while((await res.data) !== undefined) res = await res.data;
    return res;
  };

  api.list = async function(name, fields = []) {
    const camelCase = Util.ucfirst(name);
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryStr = `query List${camelCase} {${name} { ${fields.join(" ")} } }`;
    console.log(queryStr);

    let ret = await this(queryStr);
    if(typeof ret == "object" && ret[name] !== undefined) ret = ret[name];
    return ret;
  };

  api.select = function(name, obj, fields = "") {
    const camelCase = Util.ucfirst(name);
    const objStr = Util.map(obj, (key, value) => `${key}: "${value}"`).join(", ");
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryStr = `query Select${camelCase} { ${name}(${objStr}) { ${fields.join(" ")} } }`;
    console.log(queryStr);

    return this(queryStr);
  };

  api.insert = function(name, obj) {
    const camelCase = Util.ucfirst(name);
    const objStr = Util.map(obj, (key, value) => (typeof value == "string" ? `${key}: "${value}"` : `${key}: ${value}`)).join(", ");
    const fieldStr = Object.keys(obj).join(" ");
    const queryStr = `mutation Insert${camelCase} {
    __typename
    insert_${name}(objects: { ${objStr} }) {
      affected_rows
      returning { ${fieldStr} }
    }
  }`;
    return this(queryStr);
  };

  return api;
}

module.exports = API;
