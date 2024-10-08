import React from "react";
import ReactDOM from "react-dom";
import { action, autorun, observable, set, get, values, toJS } from "mobx";
import { Queries } from "./queries.js";
import dom, { Element, Timer } from "../lib/dom.js";
import { makeAutoStoreHandler, getLocalStorage, logStoreAdapter } from "./autoStore.js";
import Util from "../lib/util.js";
import { assign_to } from "../lib/devtools.js";
import devpane from "../lib/devpane.js";
import Iterator from "../lib/iterator.js";
import { transformItem, transformItemIds, transformItemData, makeItemToOption } from "./functions.js";

const isServer = !global.window;

if(global.window) {
  window.dev = { dom, Iterator };
  window.fns = {};
  window.dom = dom;
  window.Iterator = Iterator;
  Object.assign(window, { transformItem, transformItemIds, transformItemData, makeItemToOption });

  assign_to(window);
}

export class RootStore extends Queries {
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

  photos = observable.map();
  entries = observable.array([], { deep: true });
  users = observable.map();
  fields = observable.array(["Name", "Title", "Text"]);
  values = observable.map();

  items = observable.map();

  toasts = observable.array([]);

  constructor(initialData, pageProps) {
    super();
    //       console.log("RootStore.constructor.callers", Util.getCallers(1, 3));

    //console.log("RootStore.constructor ", { initialData, pageProps });

    if(initialData && initialData.RootStore) {
      const { RootStore } = initialData;

      for(let itemId in RootStore.items) {
        this.items.delete("" + itemId);
        this.items.set("" + itemId, RootStore.items[itemId]);
      }
    }
    if(global.window) {
      if(!window.devp) window.devp = new devpane("root", ".pane", ReactDOM);
      window.rs = this;
      set(this.auth, JSON.parse(localStorage.getItem("auth")));
    }

    /*  autorun(() => console.log("rootStore.authenticated: ", this.authenticated));
    autorun(() => console.log("rootStore.loading: ", this.state.loading));
    autorun(() => console.log("rootStore.auth: ", toJS(this.auth)));
    autorun(() => console.log("rootStore.auth.token: ", this.auth.token));
*/
    this.items.constructor.prototype.toObject = function() {
      return Object.fromEntries([...this.entries()].map(([k, v]) => [k, toJS(v)]));
    };

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

  /**
   * Sets the authentication id & token.
   *
   * @param      {Object}  cookies  Cookie values from request
   * @return     {Number}  User ID or -1 of not authenticated
   */
  @action
  setAuthentication(cookies) {
    let token = "",
      user_id = -1;
    if(cookies) {
      token = cookies.token;
      user_id = cookies.user_id;
      this.auth.token = token;
      this.auth.user_id = user_id;
    }
    console.log("RootStore.setAuthentication", this.authenticated);
    return user_id;
  }

  @action.bound
  updateState(obj) {
    set(this.state, obj);
    this.state.updated = true;
  }

  @action.bound
  setState(obj) {
    set(this.state, obj);
  }

  @action.bound
  newPhoto(photoObj) {
    let { id, ...photo } = photoObj;
    id = "" + id;

    console.log("rootStore.newPhoto ", photoObj);
    if(photoObj.src === undefined) photoObj.src = `/api/photo/get/${id}.jpg`;
    if(photoObj.angle === undefined) photoObj.angle = 0;

    if(photoObj.uploaded !== undefined) photoObj.uploaded = Util.parseDate(photoObj.uploaded);
    else photoObj.uploaded = new Date();

    this.photos.set(id, observable.object(photoObj));
    let image = this.photos.get(id);

    if(image.width === undefined || image.height === undefined) {
      var tm = Timer.interval(500, () => {
        let e = Util.isBrowser() ? Element.find(`#image-${id}`) : null;
        if(e && e.naturalWidth > 0 && e.naturalHeight > 0) {
          const { naturalWidth, naturalHeight, width, height } = e;
          image.width = naturalWidth;
          image.height = naturalHeight;

          tm.stop();
        }
      });
    }
    return image;
  }

  getPhoto(id) {
    id = "" + id;
    return this.photos.has(id) ? this.photos.get(id) : null;
  }

  photoExists(id) {
    id = "" + id;
    return this.photos.has(id);
  }

  @action.bound
  deletePhoto(id, completed = () => {}) {
    id = "" + id;
    let image = this.getPhoto(id);

    this.apiRequest("/api/photo/delete", { id }).then(response => {
      let data, result;
      if(response && response.data) data = response.data;
      if(data && data.result) result = data.result;
      console.log("data: ", data);
      console.log("result: ", result);
      if(result && result.affected_rows) {
        this.photos.delete(id);
        completed(result);
      }
    });
  }

  @action.bound
  rotatePhoto(id, angle = 90, completed = () => {}) {
    let image = this.getPhoto(id);
    this.apiRequest(`/api/photo/rotate`, { id, angle }).then(response => {
      const { data } = response;
      const { success, width, height } = data;
      console.log("data: ", data);
      completed({ success, width, height, id, angle });
    });
  }
  /*
  get fieldNames() {
    return this.fields.map(field => {
      const title = Util.ucfirst(field);

      return { name: field.toLowerCase(), value: "", title, label: title };
    });
  }

  @action.bound
  setValue(name, value) {
    this.values.set(name, value);
    return this;
  }

  @action.bound
  addField(name, type = "string") {
    this.fields.push("New");
  }
*/
  get currentPhoto() {
    const id = this.state.image;
    let image = this.getPhoto(id);
    if(image !== null) {
      image.id = parseInt(id);
      image.landscape = image.width > image.height;
    }
    return image;
  }

  get rootItem() {
    if(this.items.size == 0) {
      try {
        this.loadItems();
      } catch(e) {}
    }
    var root = null;
    if(this.items && this.items.entries)
      for(let [id, item] of this.items.entries()) {
        if(item && item.type == "root") root = item;
      }
    return root;
  }

  get rootItemId() {
    const item = this.rootItem;
    return item === null ? -1 : item.id;
  }

  @action
  newItem(item) {
    var childIds = item.children && item.children.map ? item.children.map(child => child.id).sort() : [];
    var id = parseInt(item.id);
    item = { ...item, id, childIds };

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
    if(item.photos && typeof item.photos == "object" && item.photos.length > 0 && item.photos.map) {
      //      if(ite && typeof(i) == 'object' && i.photo !== undefined)
      //    item.photos = item.photos.map(i => ({ ...i.photo, landscape: i.photo && i.photo.width !== undefined ? (i.photo.width > i.photo.height) : 0 }));
    }
    this.items.set("" + id, item);
    item = this.items.get("" + item.id);

    return item;
  }

  getItem(id, tr, idMap = null, depth = 1000) {
    if(idMap === null) idMap = [];
    tr = tr || transformItem;

    let item = this.items.get("" + (!id ? this.rootItemId : id));
    return item ? tr(item) : null;
  }

  getTree(id, tr, idMap = null, depth = 1000) {
    if(idMap === null) idMap = [];
    tr = tr || transformItem;

    let item = toJS(this.getItem(id, it => it, idMap, depth));
    if(item && idMap.indexOf(item.id) == -1) {
      idMap.push(item.id);
      if(typeof item == "object") {
        let { parent_id } = item;
        if(depth > 0 && item.children && item.children.length)
          item.children = item.children
            .map(i => (i != null ? this.getTree(parseInt(i.id), tr, idMap, depth - 1) : null))
            .filter(c => c !== null);
        else item.children = [];
        item.children = item.children.filter(i => i !== null);
        item.children = item.children.map(child => {
          child.parent_id = id;
          return child;
        });
      }
    }
    return item ? tr(item) : null;
  }

  entries = function* (map = null) {
    if(map === null) map = item => item;
    for(let [key, item] of this.items.entries()) yield [key, map(item)];
  };

  notLoadedChildren() {
    let arr = Object.values(this.items.toObject());
    let ret = [];
    for(let item of arr) {
      //console.log("children: ", item.children);
      if(item.children && item.children.length) {
        for(let child of item.children) {
          const id = child && child.id;
          if(!this.items.has("" + id)) ret.push(id);
        }
      }
    }
    return ret;
  }

  getHierarchy(item, fn = it => it) {
    item = item || this.rootItem;
    if(item) {
      let { name, id } = item;
      if(!name) name = `[${id}]`;
      let children = [...this.items.values()]
        .filter(child => child.parent && child.parent.id == id)
        .map(child => this.getHierarchy(child, fn));
      let ret = { name };
      if(children && children.length > 0) ret.children = children;

      return fn ? fn(ret) : ret;
    }
    return null;
  }

  @action.bound
  doLogin(username, password, completed = () => {}) {
    this.setState({ loading: true });
    Timer.once(100, () => {
      
      this.apiRequest("/api/login", { username, password }).then(res => {
      console.log("RootStore.doLogin ", res);
        const { success, token, user_id, user } = res.data;
        const { username } = user;
        this.setState({
          loading: false,
          authenticated: success,
          error: success ? undefined : "Login failed"
        });
        this.users.set(user_id, user);

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
    //console.log("rootStore.doLogout ");
    this.setState({ loading: true });
    this.apiRequest("/api/logout").then(res => {
      const { success, token, user_id } = res.data;
      this.setState({ loading: false, authenticated: false });

      set(this.auth, { token: "", user_id: -1 });
      this.auth.token = "";
      this.auth.user_id = -1;
      localStorage.removeItem("auth");
      Util.deleteCookie("token");
      Util.deleteCookie("user_id");

      completed();
    });
  }

  @action.bound
  addToast(title, message, ttl = 5000) {
    const rootStore = this;
    let deadline = Date.now() + ttl;
    let toast = message ? { title, message, deadline } : { message: title, deadline };
    let timer = Timer.until(
      deadline,
      function() {
        //console.log("Toast timer:", this);
        rootStore.removeToast(deadline);
      }.bind(toast)
    );
    toast.timer = timer;
    this.toasts.push(toast);
    return this.toasts[this.toasts.length - 1];
  }

  @action.bound
  removeToast(deadline) {
    //console.log("rootStore.removeToast ", deadline);
    let toasts = this.toasts.filter(t => t.deadline != deadline);
    this.toasts.replace(toasts);
  }

  @action.bound
  removeToasts() {
    while(this.toasts.length > 0) {
      let toast = this.toasts[0];
      if(toast.deadline <= Date.now()) {
        toast = this.toasts.shift();
        //console.log("Removed toast:", toast);
      } else {
        break;
      }
    }
  }
}

export const singleton = new RootStore();

export default RootStore;
