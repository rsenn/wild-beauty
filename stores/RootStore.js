import React from "react";
import { action, autorun, observable, flow, set, get, values, toJS, computed } from "mobx";
import getAPI from "../stores/api.js";
import { Element, Timer } from "../utils/dom.js";
import axios from "../utils/axios.js";
import { makeAutoStoreHandler, getLocalStorage, logStoreAdapter } from "./autoStore.js";
import Util from "../utils/util.js";
import { assign_to } from "../utils/devtools.js";
import devpane from "../utils/devpane.js";

const isServer = !global.window;

if (global.window) {
  window.dev = {};
  window.fns = {};

  assign_to(window);
}

/**
 * This class describes the root store.
 *
 * @class      RootStore (name)
 */
export class RootStore {
  @observable
  state = {
    articles: [],
    updated: false,
    mirrored: false,
    angle: 0,
    subpage: 0,
    loading: false,
    authenticated: false,
    error: undefined,
    selected: -1,
    image: null,
    parent_id: -1,
    tree: {}
  };

  auth = observable.object({
    user_id: "",
    token: ""
  });

  images = observable.map();
  entries = observable.array([], { deep: true });
  users = observable.map();
  fields = observable.array(["name", "title", "text"]);
  items = observable.map();

  api = getAPI();

  /**
   * Constructs the RootStore
   *
   * @param      {<type>}  initialData  The initial data
   * @param      {<type>}  pageProps    The page properties
   */
  constructor(initialData, pageProps) {
    console.log("RootStore.constructor ", { initialData, pageProps });
    if(initialData && initialData.RootStore) {
      const init = initialData.RootStore;
      for(let k in init) {
        switch (k) {
          case "images": {
            this.images = observable.map(init[k]);
            break;
          }
        }
      }
    }
    if(global.window) {
      if(!window.devp) window.devp = new devpane();
      window.rs = this;
      set(this.auth, JSON.parse(localStorage.getItem("auth")));
    }

    autorun(() => console.log("rootStore.authenticated: ", this.authenticated));
    autorun(() => console.log("rootStore.loading: ", this.state.loading));
    autorun(() => console.log("rootStore.auth: ", toJS(this.auth)));
    autorun(() => console.log("rootStore.auth.token: ", this.auth.token));

    this.enableAutoRun();
    const { auth, state } = this;
  }

  enableAutoRun = () => {
    this.stores = {
      auth: makeAutoStoreHandler("auth", logStoreAdapter(getLocalStorage))(this, "auth")
    };
    this.autorunners = [this.stores.auth];
  };

  disableAutoRun = () => {
    this.autorunners.forEach(disposer => (typeof disposer == "function" ? disposer() : undefined));
    this.autorunners = [];
  };

  get authenticated() {
    return !!(this.auth.token && this.auth.token.length > 0);
  }

  @action.bound
  updateState(obj) {
    set(this.state, obj);
    this.state.updated = true;
    //console.log("RootStore.updateState ", obj);
  }

  @action.bound
  setState(obj) {
    set(this.state, obj);
  }

  @action.bound
  /**
   * Add new image record
   *
   * @param      {<type>}  imageObj  The image object
   * @return     {number}  { description_of_the_return_value }
   */
  newImage(imageObj) {
    let { id, ...photo } = imageObj;
    id = parseInt(id);

    console.log("rootStore.newImage ", imageObj);
    if(imageObj.src === undefined) imageObj.src = `/api/image/get/${id}.jpg`;

    this.images.set(id, observable.object(imageObj));
    let image = this.images.get(id);

    if(image.width === undefined || image.height === undefined) {
      var tm = Timer.interval(500, () => {
        let e = Element.find(`#image-${id}`);
        if(e && e.naturalWidth > 0 && e.naturalHeight > 0) {
          const { naturalWidth, naturalHeight, width, height } = e;
          image.width = naturalWidth;
          image.height = naturalHeight;
          //console.log({ naturalWidth, naturalHeight, width, height });
          tm.stop();
        }
      });
    }
    return image;
  }

  /**
   * Gets an image.
   *
   * @param      {<type>}  id      The identifier
   * @return     {<type>}  The image.
   */
  getImage(id) {
    id = "" + id;
    return this.images.has(id) ? this.images.get(id) : null;
  }

  /**
   * Determines if image exists.
   *
   * @param      {<type>}  id      The identifier
   * @return     {<type>}  True if image exists, False otherwise.
   */
  imageExists(id) {
    id = parseInt(id);
    return this.images.has(id);
  }

  @action.bound
  deleteImage(id) {
    let image = this.getImage(id);
    //console.log("deleteImage :", image);
    this.apiRequest("/api/image/delete", { id }).then(response => {
      let data, result;
      if(response && response.data) data = response.data;
      if(data && data.result) result = data.result;
      if(result.affected_rows) {
        this.images.delete(id);
      }
      //console.log("deleteImage API response:", result);
    });
  }

  /**
   * Get field names
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  get fieldNames() {
    return this.fields.map(field => ({ value: field.toLowerCase(), label: Util.ucfirst(field) }));
  }

  /**
   * Gets the current image
   *
   * @return     {Object}  {Uploaded image}
   */
  get currentImage() {
    const id = this.state.image;
    let image = this.getImage(id);
    if(image !== null) {
      image.id = parseInt(id);
      image.landscape = image.width > image.height;
    }
    return image;
  }

  get rootItem() {
    if(this.items.size == 0) this.loadItems(/*{ parent_id: null }*/);
    var root = null;
    if(this.items && this.items.entries)
      for(let [id, item] of this.items.entries()) {
        // console.log("item: ", toJS( item));
        if(item && item.type == "root") root = item;
      }
    return root;
  }

  get rootItemId() {
    const item = this.rootItem;
    return item === null ? -1 : item.id;
  }

  /**
   * Add new item
   *
   * @param      {Object}  item    The item
   * @return     {Object}  observable item
   */
  @action
  newItem(item) {
    var childIds = item.children && item.children.map ? item.children.map(child => child.id).sort() : [];
    var id = parseInt(item.id);
    item = { ...item, id, childIds };
    //delete item.children;
    delete item.parent;

    if(typeof item.data == "string" && item.data.length > 0) {
      var data = {};

      try {
        data = JSON.parse(item.data.replace(/\n/g, "\\n"));
      } catch(err) {
        console.error("newItem JSON.parse error", item.data);
      }
      item.data = data;
    }

    if(item.photos && item.photos.length > 0 && item.photos.map) {
      item.photos = item.photos.map(i => ({ ...i.photo, landscape: i.photo.width > i.photo.height }));
    }

    this.items.set(id, item);
    item = this.items.get(item.id);
    //console.log("New item: ", item);
    return item;
  }

  /**
   * Gets an item.
   *
   * @param      {<type>}          id            The identifier
   * @param      {Function}        [tr=it=>it]   { parameter_description }
   * @param      {(Array|string)}  [idMap=null]  The identifier map
   * @return     {<type>}          The item.
   */
  /*  @action*/
  getItem(id, tr = it => it, idMap = null) {
    if(idMap === null) idMap = [];
    let item = this.items.get(!id ? this.rootItemId : id);

    if(item && idMap.indexOf(item.id) == -1) {
      idMap.push(item.id);
      if(typeof item == "object") {
        //console.log("item", toJS(item));

        let { parent_id } = item;

        /*     if(item.childIds && item.childIds.length) item.children = item.childIds.map(id => this.getItem(id, tr, idMap));
        else */ if(item.children && item.children.length)
          item.children = item.children.map(i => (i != null ? this.getItem(parseInt(i.id), tr, idMap) : null)).filter(c => c !== null);
        else item.children = [];
        /*
        if(typeof(item.data) == 'string' && item.data.length > 0)
          item.data = JSON.parse(item.data);*/
        // item.children = item.children.map(it => this.items.get(it.id, tr, idMap))
        /*.filter(it => it !== undefined)*/
        //
      }
    }
    return item ? tr(item) : null;
  }

  async fetchImages(where = {}) {
    console.log("⇒ images ", { where });
    let response = await this.api.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "user_id", "items { item_id }"], { where });
    console.log("⇐ images =", response);
    return response;
  }

  async fetchItems(where = {}) {
    console.log("⇒ items:", where);
    let response = await this.api.list("items", ["id", "type", "parent { id }", "children { id }", "data", "photos { photo { id } }", "users { user { id } }"]);
    console.log("⇐ items =", response);
    return response;
  }

  /**
   * Fetches items.
   *
   * @param      {<type>}   [where={}]  The where
   * @return     {Promise}  The items.
   */
  async loadItems(where = {}) {
    let response = await this.apiRequest("/api/item/tree", Util.isEmpty(where) ? {} : { where });
    let items, data = response ? await response.data : null;
    if(await data)
      items = await data.items;
    if(!items) return 0;

      //console.log("RootStore.loadItems", data);
      for(let key in items) {
        const id = parseInt(items[key].id || key);
        this.items.delete(id);
        this.items.set(id, items[key]);
      }
    return items.length;
  }

  /**
   * Saves an item.
   *
   * @param      {<type>}  event   The event
   */
  async;
  saveItem(event) {
    const photo_id = (rs.currentImage && rs.currentImage.id) || rs.state.image;
    const parent_id = rs.state.parent_id;

    const { name = null, ...dataObj } = this.entries.reduce((acc, entry) => ({ ...acc, [Util.decamelize(entry.type)]: entry.value }), {});

    console.log("saveItem", { photo_id, parent_id, name, dataObj });

    return this.apiRequest("/api/item/new", { photo_id, parent_id, name, data: dataObj }).then(response => {
      console.log("saveitem API response:", response);
    });
  }
  /*
  fetchArticles = flow(function*(page = window.location.href.replace(/.*\//g, "")) {
    // <- note the star, this a generator function!
    this.result = "pending";
    let articles;
    //   let promise = new Promise(async function(resolve, reject) {
    try {
      articles = yield this.api(`
      query MyQuery {
        pages(where: {name: {_eq: "${page}"}}) {
          items {
            id
            type
            data
            page_id
          }
        }
        }`);
      articles = Util.findVal(articles, "items");

      if(articles) this.setState({ articles });
      // the asynchronous blocks will automatically be wrapped in actions and can modify state
      this.result = "done";
    } catch(error) {
      //  reject();
      this.result = "error";
    }
    return articles;
  });

  async loadArticles(page = "") {
    if(page == "") page = "home";
    let result = await this.api(`
      query MyQuery {
        pages(where: {name: {_eq: "${page}"}}) {
          items {
            id
            type
            data
            page_id
          }
        }
        }`);
    let articles = Util.findVal(await result, "items");

    return result;
  }
*/

  /**
   * Perform async API request
   *
   * @param      {string}   endpoint  The endpoint
   * @param      {<type>}   data      The data
   * @return     {Promise}  { description_of_the_return_value }
   */
  async apiRequest(endpoint, data) {
    let res;
    console.log("RootStore.apiRequest", { endpoint, data });
    if(!data) res = await axios.get(endpoint);
    else res = await axios.post(endpoint, data);

    if(res && ((await res.status) != 200 || !(await res.data) || !(await res.data.success))) {
      console.log("RootStore.apiRequest " + endpoint, data, " ERROR ", res);
      throw new Error(`apiRequest status=${res.status} data=${res.data}`);
    }

    return res;
  }

  /**
   * Does a login.
   *
   * @param      {<type>}    username            The username
   * @param      {<type>}    password            The password
   * @param      {Function}  [completed=()=>{}]  The completed
   */
  @action.bound
  doLogin(username, password, completed = () => {}) {
    this.setState({ loading: true });
    Timer.once(100, () => {
      this.apiRequest("/api/login", { username, password }).then(res => {
        const { success, token, user_id, user } = res.data;
        const { username } = user;
        this.setState({
          loading: false,
          authenticated: success,
          error: success ? undefined : "Login failed"
        });
        this.users.set(user_id, user);
        /*   this.auth.token = token;
        this.auth.user_id = user_id;*/
        this.disableAutoRun();
        let newAuth = { token, user_id, user };
        set(this.auth, newAuth);
        if(global.window) localStorage.setItem("auth", JSON.stringify(newAuth));
        this.enableAutoRun();
        //console.log("API login result: ", { success, token });
        if(success && window.global) {
          for(let name of ["token"]) document.cookie += `${name}=${res.data[name]}; Path=/; `;
          //console.log("Cookies: ", document.cookie);
        }
        completed(res.data);
      });
    });
  }

  /**
   * Does a logout.
   *
   * @param      {Function}  [completed=()=>{}]  The completed
   */
  @action.bound
  doLogout(completed = () => {}) {
    console.log("rootStore.doLogout ");
    this.setState({ loading: true });
    this.apiRequest("/api/logout").then(res => {
      const { success, token, user_id } = res.data;
      this.setState({ loading: false, authenticated: false });
      //      this.disableAutoRun();
      set(this.auth, { token: "", user_id: -1 });
      this.auth.token = "";
      this.auth.user_id = -1;
      localStorage.removeItem("auth");
      Util.deleteCookie("token");
      Util.deleteCookie("user_id");
      //    this.enableAutoRun();
      completed();
    });
  }
}

export const singleton = new RootStore();

export default RootStore;
