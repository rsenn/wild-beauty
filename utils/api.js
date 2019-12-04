const axios = require("axios");
const Util = require("./util.js");

function API() {
  const url = "http://wild-beauty.herokuapp.com/v1/graphql";
  var api = async function(query) {
    const res = await axios({
      url,
      method: "POST",
      headers: {
        "Accept-Encoding": "deflate, br;q=1.0, gzip;q=0.9, *;q=0.5"
      },
      data: JSON.stringify({ query }),
      responseType: "blob"
    });
    //console.log("res: ", res);
    return res;
  };

  api.insert = function(name, obj) {
    const camelCase = Util.ucfirst(name);
    const objStr = Util.map(obj, (key, value) =>
      typeof value == "string" ? `${key}: "${value}"` : `${key}: ${value}`
    ).join(", ");
    const fieldStr = Object.keys(obj).join(" ");
    const queryStr = `mutation Insert${camelCase} {
    __typename
    insert_${name}(objects: { ${objStr} }) {
      affected_rows
      returning { ${fieldStr} }
    }
  }`;
    console.log(queryStr);
    return this(queryStr);
  };

  return api;
}

module.exports = API;
