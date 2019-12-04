const axios = require("axios");

function API() {
  const url = "http://wild-beauty.herokuapp.com/v1/graphql";
  return async function(query) {
    const json = {
      query
    };
    const res = await axios.post(url, JSON.stringify(json));
    //console.log("res: ", res);
    return res;
  };
}

module.exports = API;
