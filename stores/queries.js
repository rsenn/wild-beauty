import getAPI from "./api.js";
import Util from "../utils/util.js";

export class Queries {
  api = getAPI();

  async fetchImages(where = {}) {
    console.log("⇒ images ", { where });
    let response = await this.api.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "user_id", "items { item_id }"], { where });
    console.log("⇐ images =", response);
    return response;
  }
  /*
  async fetchItems(where = {}) {
    console.log("⇒ items:", where);
    let response = await this.api.list("items", [
      "id",
      "type",
      "parent { id }",
      "children { id }",
      "data",
      "photos { photo { id } }",
      "users { user { id } }"
    ]);
    console.log("⇐ items =", response);
    return response;
  }
*/
  async refreshItem(id, props) {
    let response = await this.apiRequest("/api/item", { id, update: props });
    let { data } = await response;
    let { success } = await data;
    let item = typeof (await data.item) == "object" ? this.getItem(data.item.id) : null;
    if(item) {
      Object.assign(item, await data.item);
      console.log("item updated: ", item);
    }
    return item;
  }

  async updateItem(id, props) {
    let item = null;
    if(!this.items.has("" + id)) this.items.set("" + id, props);
    item = this.items.get("" + id);
    for(let key in props) item[key] = props[key];
    return item;
  }

  /**
   * Fetches items.
   *
   * @param      {<type>}   [where={}]  The where
   * @return     {Promise}  The items.
   */
  async loadItems(where = {}) {
    let response = await this.apiRequest("/api/tree", Util.isEmpty(where) ? {} : { where });
    let items,
      data = response ? await response.data : null;
    if(await data) items = await data.items;
    if(!items) return 0;

    //console.log("RootStore.loadItems", data);
    for(let key in items) {
      const id = parseInt(items[key].id || key);
      this.items.delete("" + id);
      this.items.set("" + id, items[key]);
    }
    return items;
  }

  async loadItem(where = {}) {
    if(typeof where == "number") where = { id: where };
    let response = Util.isServer() ? await this.api.select("items", where, ["id", "type", "parent { id }", "children { id }", "data", "photos { photo { id original_name width height filesize } }", "users { user { id } }"]) : await this.apiRequest("/api/item", where);
    let items = response ? await response.items : null;
    let item = (await items) ? await items[0] : null;
    const id = "" + (item && item.id !== undefined ? item.id : where.id);
    if(item.photos && item.photos.length) {
      for(let i = 0; i < item.photos.length; i++) item.photos[i] = this.newImage(item.photos[i].photo);
    }
    if(item.data) {
      let obj = {};
      let jsonStr = item.data;
      delete item.data;
      try {
        obj = JSON.parse(jsonStr);
      } catch(err) {}
      if(typeof obj == "object") Object.assign(item, obj);
    }
    if(!this.items.has(id)) this.items.set(id, item);
    let it = this.items.get(id);
    Object.assign(it, item);
    return it;
  }

  /**
   * Saves an item.
   *
   * @param      {<type>}  event   The event
   */

  saveItem(event, doneHandler = result => {}) {
    const photo_id = (rs.currentImage && rs.currentImage.id) || rs.state.image;
    const parent_id = rs.state.parent_id;

    const { name = null, ...dataObj } = this.entries.reduce((acc, entry) => ({ ...acc, [Util.decamelize(entry.type)]: entry.value }), {});

    console.log("saveItem", { photo_id, parent_id, name, dataObj });

    return this.apiRequest("/api/item/new", { photo_id, parent_id, name, data: dataObj }).then(response => {
      console.log("saveitem API response:", response);
      doneHandler(response);
    });
  }

  async findItem(id) {
    if(typeof id == "object" && id.id !== undefined) id = id.id;
    return this.items.has("" + id) ? this.items.get("" + id) : await this.loadItem(id);
  }

  async getDepth(id) {
    let parents = await this.getParents(id);
    return parents.length;
  }

  async getSiblings(id) {
    let item = await this.findItem(id);
    const parentId = item.parent ? item.parent.id : item.parent_id;
    let result = await this.loadItems(`{ parent_id: { _eq: ${parentId} } }`);

    return result;
  }

  async getChildren(id) {
    return await this.loadItems(`{ parent_id: { _eq: ${id} } }`);
  }

  async getParents(id) {
    let item;
    let result = [];
    do {
      item = await this.findItem(id);
      if(!(typeof item == "object" && item.id !== undefined)) break;
      result.push(item);
      id = item.parent ? item.parent.id : item.parent_id;
    } while(id > -1);
    result.shift();
    return result;
  }
}

export default Queries;
