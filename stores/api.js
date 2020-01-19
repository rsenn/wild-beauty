const Blob = require("blob");

const axios = require("../utils/axios.js").httpClient;
const Util = require("../utils/util.js");

function API(url = "http://wild-beauty.herokuapp.com/v1/graphql") {
  var api = async function(query) {
    let res = await axios({
      url,
      method: "POST",
      headers: {
        //  "Accept-Encoding": "deflate, br;q=1.0, gzip;q=0.9, *;q=0.5",
        "X-Hasura-Access-Key": "RUCXOZZjwWXeNxOOzNZBptPxCNl18H"
      },
      data: JSON.stringify({ query }),
      responseType: "blob"
    });
    while((await res.data) !== undefined) res = await res.data;
    if(res && res.text !== undefined) res = await res.text();
    if(typeof res == "string") res = JSON.parse(res);
    while((await res.data) !== undefined) res = await res.data;
    //console.log("res: ", res);
    if(res.errors !== undefined) {
      console.error("res.errors: ", res.errors);
      //  console.error("query: ", query);
      throw Error(res.errors[0].message);
    }
    return res;
  };

  api.list = async function(name, fields = [], opts = {}) {
    const camelCase = Util.ucfirst(name);
    //if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const { where, ...options } = opts;
    console.log("api.list ", { name, where, options });
    let objStr;
    // prettier-ignore
    objStr = where     ? (typeof where == "string"? `where: ${where}` : ("where: {"+Object.entries(where) .map(([key, value]) => `${key}: {` + (value === null ? `_is_null: true` : `_eq:${value}`) + `}`) .join(", ") +" }")) : "";
    objStr += Object.keys(options)
      .map(key => `${key}: ${options[key]}`)
      .join(", ");

    if(objStr.length) objStr = `(${objStr})`;
    const queryStr = `query List${camelCase} { ${name}${objStr} { ${fields} } }`;
    console.log("query: ", queryStr);
    let ret = await this(queryStr);
    if(typeof ret == "object" && ret[name] !== undefined) ret = ret[name];
    return ret;
  };

  api.select = function(name, obj, fields = "") {
    const camelCase = Util.ucfirst(name);
    // prettier-ignore
    const objStr =    (typeof obj == "string"? `where: ${obj}` : "where: { " + Object.entries(obj) .map(([key, value]) => `${key}: {_eq: ${value}}`) .join(", ") + "}");
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryStr = `query Select${camelCase} { ${name}(${objStr}) { ${fields.join(" ")} } }`;
    console.log(`query: ${queryStr}`);

    let result = this(queryStr);
    console.log(`result: ${result}`);
    return result;
  };

  api.update = async function(name, obj, fields = {}) {
    const camelCase = Util.ucfirst(name);
    const objStr = "where: {" + Util.map(obj, (key, value) => `${key}: {_eq:${value}}`).join(", ") + "}";
    const setStr = "_set: {" + Util.map(fields, (key, value) => `${key}: "${value}"`).join(", ") + "}";
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryName = `update_${name.replace(/s*$/, "s")}`;
    const queryStr = `mutation ${queryName}{ ${queryName}(${objStr}, ${setStr}) { affected_rows } }`;
    console.log("query: ", queryStr);

    let response = await this(queryStr);
    //console.log("response: ", response[queryName]);
    return response[queryName];
  };

  api.delete = async function(name, obj) {
    const camelCase = Util.ucfirst(name);
    const objStr = "where: {" + Util.map(obj, (key, value) => `${key}: {_eq:"${value}"}`).join(", ") + "}";
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryName = `delete_${name.replace(/s?$/, "s")}`;
    const queryStr = `mutation ${queryName}{ ${queryName}(${objStr}) { affected_rows } }`;
    //console.log("query: ", queryStr);

    let response = await this(queryStr);
    //console.log("response: ", response[queryName]);
    return response[queryName];
  };

  api.insert = async function(name, obj, fields = []) {
    const camelCase = Util.ucfirst(name);
    // prettier-ignore
    const objStr = Object.keys(obj) .map(key => typeof obj[key] == "string" && key == "name" /* && !/^".*"$/.test(obj[key])*/ ? `${key}: "${obj[key]}"` : `${key}: ${obj[key]}` ) .join(", ");
    const fieldStr = [/*...Object.keys(obj), */ ...fields].join(" ");
    const queryStr = `mutation Insert${camelCase} {
    __typename
    insert_${name}(objects: { ${objStr} }) {
      affected_rows
      returning { ${fieldStr} }
    }
  }`;

    let response = await this(queryStr);
    console.log("response: ", response, "query: ", queryStr);
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
