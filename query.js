/* 

    node query.js select items
    node query.js select photos
    node query.js select users

  node query.js update items 149 '{parent_id:1}'
  node query.js update items 149 '{visible:true,parent_id:1}'
  node query.js update items '{id: {_in: [149,150,151,152] }}' '{visible:true,parent_id:1,type:"subcategory"}'

  node query.js delete items '{id: {_in: [149,150,151,152] }}' 

 */

const prettyoutput = require("prettyoutput");
var Blob = require("blob");
const API = require("./stores/api.js");
const Util = require("./lib/util.es5.js");
const util = require("util");
const fs = require("fs");
const path = require("path");
const jpeg = require("./lib/jpeg.js");
const RGBA = require("./lib/dom.es5.js").RGBA;

(async () => {
  // prettier-ignore
  const fields = {
    items: ['id', 'name', 'parent_id', 'type', 'data', 'visible', 'children { id }', 'photos { photo_id }', 'users { user_id }'],
    photos: ['id', 'colors', 'filesize', 'width', 'height', /*'items { id }',*/ , 'exif','offset', 'original_name', 'uploaded', 'user_id', 'items { item_id }' ],
    users: ['id', 'username', 'email', 'last_seen', 'password', 'token']
  };

  const debug = true;

  const api = new API("http://wild-beauty.herokuapp.com/v1/graphql", { secret: "RUCXOZZjwWXeNxOOzNZBptPxCNl18H", debug });

  let args = process.argv;

  let arg;
  let myname = path.basename(__filename);
  let re = new RegExp(`${myname}`);
  console.log(myname);

  do {
    arg = args.shift();
  } while(!re.test(arg));

  let command = args.shift();
  let entity = args.shift();
  let where = args.shift();
  let set = args.length > 0 ? args.shift() : undefined;

  //console.log("test ", { command, entity, where });

  const f = fields[entity];
  const fn = api[command];

  if(f === undefined) throw new Error(`No such entity: ${entity}`);

  if(fn === undefined) throw new Error(`No such command: ${command}`);

  if(/^[0-9]+$/.test(where)) {
    where = `{id: {_eq: ${parseInt(where)} }}`;
  } else if(typeof where == "string" && where[0] == "{") {
    /* where = "where = " + where;
    let fn = new Function(where + "; return where;");
    where = fn();*/
    console.log("where:", where);
  } else {
    where = undefined;
  }

  console.log("args:", { api, entity, where, f, set });
  let result = await fn.call(api, entity, where, f, set);
  /*
if(debug)
  console.log("result:", util.inspect(result, false, 10, true));
*/
  const { affected_rows } = result;

  let records = await result[entity];

  if(records && records.length > 0) {
    records = records.sort((a, b) => a.id - b.id);
    records = records.map(rec => {
      if(rec.data !== undefined) {
        if(typeof rec.data == "string" && rec.data[0] == "{") rec.data = JSON.parse(rec.data);
      }
      for(let key of ["children", "photos", "users"]) if(Util.isEmpty(rec[key]) /*|| (rec[key] instanceof Array && rec[key].length == 0)*/) delete rec[key];
      delete rec.toObject;
      delete rec.match;

      for(let key in rec) {
        const val = rec[key];
        if(/^....-..-..T..:..:../.test(val)) {
          rec[key] = Util.toUnixTime(Util.parseDate(val));
        } else if(typeof val == "string" && val.length > 50) {
          rec[key] = val.substring(0, 100) + "...";
        }
      }
      return rec;
    });

    let biggest = Util.map((key, value) => [key, typeof value == "number" ? value.toString() : "" + value]);

    for(let record of records) {
      for(let key in record) {
        let value = typeof record[key] == "number" ? record[key].toString() : "" + record[key];

        biggest[key] += "";
        if(("" + biggest[key]).length < value.length) biggest[key] = typeof value == "number" ? value.toString() : "" + value;
      }
    }

    //console.log("biggest:", biggest);

    biggest = Object.entries(biggest).map(([key, value]) => [key, ("" + value).length]);
    biggest = biggest.sort((a, b) => a[1] - b[1]).filter(f => f[0] !== "toObject" && f[0] !== "match" && f[0] !== "children");
    let fields = biggest.map(f => f[0]);
    let sizes = Object.fromEntries(biggest.map((f, i) => [f[0], Math.max(f[0].length + 1, f[1] + 1)]));
    biggest = Object.fromEntries(biggest);
    /*
    console.log("biggest:", biggest);
    console.log("fields:", fields);
    console.log("sizes:", sizes);*/
    sizes["exif"] = 100;

    let header = "\n" + fields.map(field => field + Util.pad(field, sizes[field])).join("");

    header += "\n" + fields.map(field => "‾".repeat(sizes[field] - 1)).join(" ");

    console.log(header);
    for(let record of records) {
      let row = fields
        .map(field => {
          let value = record[field];

          if(typeof value == "object") {
            try {
              value = Util.inspect(value, { newline: "", indent: "", spacing: " " })
                .replace(/\s+/g, "")
                .replace(/,/g, ", ");
            } catch(err) {
              value = JSON.stringify(value);
            }
          }

          let size = sizes[field];

          //console.log("row ", { value, field, size });
          if(typeof value != "string") value = value === undefined ? "undefined" : "" + value;
          if(typeof value != "string") value = "";

          return value + Util.pad(value, size, " ");
        })
        .join("");
      console.log(row); //"record:", value);
    }
  }
  if(affected_rows > 0) console.log(`Affected rows in '${entity}': ${affected_rows}`);
})();
