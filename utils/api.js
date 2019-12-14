const Blob = require("blob");

const axios = require("axios");
const Util = require("./util.js");

function API(url = "http://wild-beauty.herokuapp.com/v1/graphql") {
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

    if(res && res.text !== undefined) res = await res.text();

    if(typeof res == "string") res = JSON.parse(res);

    while((await res.data) !== undefined) res = await res.data;

    return res;
  };

  api.list = async function(name, fields = [], options = {}) {
    const camelCase = Util.ucfirst(name);
    //if(typeof fields == "string") fields = fields.split(/[ ,;]/g);

    const optKeys = Object.keys(options);
    const optStr = optKeys.length > 0 ? "(" + optKeys.map(key => `${key}: ${options[key]}`).join(", ") + ")" : "";
    const queryStr = `query List${camelCase} {${name}${optStr} { ${fields} } }`;
    console.log("query: ", queryStr, { optStr });

    let ret = await this(queryStr);
    if(typeof ret == "object" && ret[name] !== undefined) ret = ret[name];
    return ret;
  };

  api.select = function(name, obj, fields = "") {
    const camelCase = Util.ucfirst(name);
    const objStr = "where: {" + Util.map(obj, (key, value) => `${key}: {_eq:"${value}"}`).join(", ") + "}";
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryStr = `query Select${camelCase} { ${name}(${objStr}) { ${fields.join(" ")} } }`;
    console.log(queryStr);

    return this(queryStr);
  };

  api.update = async function(name, obj, fields = {}) {
    const camelCase = Util.ucfirst(name);
    const objStr = "where: {" + Util.map(obj, (key, value) => `${key}: {_eq:"${value}"}`).join(", ") + "}";
    const setStr = "_set: {" + Util.map(fields, (key, value) => `${key}: "${value}"`).join(", ") + "}";
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryName = `update_${name}`;
    const queryStr = `mutation ${queryName}{ ${queryName}(${objStr}, ${setStr}) { affected_rows } }`;
    console.log("query: ", queryStr);

    let response = await this(queryStr);
    console.log("response: ", response[queryName]);
    return response[queryName];
  };

  api.insert = async function(name, obj, fields = []) {
    const camelCase = Util.ucfirst(name);
    const objStr = Util.map(obj, (key, value) => (typeof value == "string" ? `${key}: "${value}"` : `${key}: ${value}`)).join(", ");
    const fieldStr = [...Object.keys(obj), ...fields].join(" ");
    const queryStr = `mutation Insert${camelCase} {
    __typename
    insert_${name}(objects: { ${objStr} }) {
      affected_rows
      returning { ${fieldStr} }
    }
  }`;

    let response = await this(queryStr);
    //   console.log("response: ", response, "query: ", queryStr);
    return response;
  };

  return api;
}

let apiInstance = null;

function getAPI() {
  if(apiInstance == null) {
    apiInstance = API.apply(API, arguments);
  }
  return apiInstance;
}

module.exports = getAPI;
