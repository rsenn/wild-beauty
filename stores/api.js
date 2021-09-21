//const Blob = require("blob");
import Blob from 'blob';

import { httpClient as axios } from 'axios';
import Util from '../lib/util.js';
//const axios = require("../lib/axios.es5.js").httpClient;
//const Util = require("../lib/util.es5.js").default;

//Util.ucfirst = str => str.substring(0, 1).toUpperCase() + str.substring(1);

function API(url = "http://wild-beauty.herokuapp.com/v1/graphql", options = { debug: false }) {
  const { debug, secret } = options;
  //console.log("New API: ", { url, debug, secret }, Util.getCallers());
  var api = async function(query) {
    let res = await axios({
      url,
      method: "POST",
      headers: { "Accept-Encoding": "deflate, br;q=1.0, gzip;q=0.9, *;q=0.5", ...(secret ? { "X-Hasura-Access-Key": secret } : {}) },
      data: JSON.stringify({ query }),
      responseType: "blob"
    });
    while((await res.data) !== undefined) res = await res.data;
    if(res && res.text !== undefined) res = await res.text();
    if(typeof res == "string") res = JSON.parse(res);
    while((await res.data) !== undefined) res = await res.data;
    //console.log("res: ", res);
    if(res.errors && typeof res.errors == "object" && res.errors[0]) {
      console.error("res.errors: ", res.errors); //, query.substring(0, 100) + "...");
      console.error("query: ", query);
      throw res.errors[0].message;
    }
    return res;
  };

  api.options = options;

  api.list = async function(name, fields = [], opts = {}) {
    const camelCase = Util.ucfirst(name);
    //if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const { where, ...options } = opts;
    console.log("api.list ", { name, fields, where, options });
    let objStr;
    // prettier-ignore
    objStr = where     ? (typeof where == "string"? `where: ${where}` : ("where: {"+Object.entries(where) .map(([key, value]) => `${key}: {` + (value === null ? `_is_null: true` : `_eq:${value}`) + `}`) .join(", ") +" }")) : "";
    if(options.length)
      objStr +=
        "," +
        Object.keys(options)
          .map(key => `${key}: ${options[key]}`)
          .join(", ");

    if(objStr.length) objStr = `(${objStr})`;
    const queryStr = `query List${camelCase} { ${name}${objStr} { ${typeof fields == "string" ? fields : fields.join(" ")} } }`;
    if(debug) console.log("query: ", queryStr);
    let ret = await this(queryStr);
    if(typeof ret == "object" && (await ret[name]) !== undefined) ret = await ret[name];
    if(debug) console.log("ret: ", ret);
    return await ret;
  };

  api.select = function(name, obj, fields = "") {
    const camelCase = Util.ucfirst(name);
    // prettier-ignore
    const objStr = !obj ? '' :  (typeof obj == "string"? `(where: ${obj})` : "(where: { " + Object.entries(obj) .map(([key, value]) => `${key}: {_eq: ${value}}`) .join(", ") + "})");
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryStr = `query Select${camelCase} { ${name}${objStr} { ${typeof fields == "string" ? fields : fields.join(" ")} } }`;
    if(this.options.debug) console.log(`query: ${queryStr}`);

    let result = this(queryStr);
    //console.log(`result: ${result}`);
    return result;
  };

  api.update = async function(name, obj, fields = {}, set) {
    const camelCase = Util.ucfirst(name);
    let objStr = obj;

    if(typeof obj == "object") objStr = "{" + Util.map(obj, (key, value) => `${key}: {_eq:${value}}`).join(", ") + "}";
    let setStr = typeof set == "string" ? set : typeof fields == "object" ? fields : set;

    if(typeof setStr == "object") setStr = "{" + Util.map(setStr, (key, value) => `${key}: "${value}"`).join(", ") + "}";
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    //console.log("setStr = ", setStr);
    const queryName = `update_${name.replace(/s*$/, "s")}`;
    const queryStr = `mutation ${queryName}{ ${queryName}(where: ${objStr}, _set: ${setStr}) { affected_rows } }`;
    if(debug) console.log("query: ", queryStr);

    let response = await this(queryStr);
    //console.log("response: ", response[queryName]);
    return response[queryName];
  };

  api.delete = async function(name, obj) {
    if(name == "items") {
      let r = await api.delete("items_users", `{item:${obj}}`);
      console.log("r: ", r);
    }
    const camelCase = Util.ucfirst(name);
    let objStr;

    if(typeof obj == "string") objStr = obj;
    else objStr = "{" + Util.map(obj, (key, value) => `${key}: {_eq: ${value}}`).join(", ") + "}";

    console.log("objStr:", objStr);
    if(typeof fields == "string") fields = fields.split(/[ ,;]/g);
    const queryName = `delete_${name.replace(/s?$/, "s")}`;
    const queryStr = `mutation ${Util.camelize(queryName)}{ ${queryName}(where: ${objStr}) { affected_rows returning { id } } }`;
    if(debug) console.log("query: ", queryStr);

    let response = await this(queryStr);
    console.log("response: ", response[queryName]);
    return response[queryName];
  };

  api.insert = async function(name, obj, fields = []) {
    const camelCase = Util.ucfirst(name);
    // prettier-ignore
    let objStr;
    if(typeof obj == "string") objStr = obj;
    else
      objStr =
        "{" +
        Object.keys(obj)
          .map(key => (typeof obj[key] == "string" && key == "name" /* && !/^".*"$/.test(obj[key])*/ ? `${key}: "${obj[key]}"` : `${key}: ${obj[key]}`))
          .join(", ") +
        "}";
    const queryStr = `mutation Insert${camelCase} {
    __typename
    insert_${name}(objects: ${objStr}) {
      affected_rows
      returning { ${typeof fields == "string" ? fields : fields.join(" ")} }
    }
  }`;

    let response = await this(queryStr);
    if(debug) console.log("insert response: ", response, "query: ", queryStr);
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

module.exports = { API, getAPI };
