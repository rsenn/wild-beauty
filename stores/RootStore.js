import React from "react";
import { action, observable, flow, set, get, values, computed } from "mobx";
import getAPI from "../utils/api.js";
import { Timer } from "../utils/dom.js";
import axios from "../utils/axios.js";
import { makeAutoStoreHandler, getLocalStorage, logStoreAdapter } from "./autoStore.js";
import Util from "../utils/util.js";
import { assign_to } from "../utils/devtools.js";
import devpane from "../utils/devpane.js";

const isServer = !Util.isBrowser();

if (!isServer) {
  window.devp = new devpane();
  window.dev = {};
  window.fns = {};

  assign_to(window);
  //  assign_to(window.dev);
  // Object.assign(window, { REST_API, API_URL });
  //Object.assign(window.fns, { Container, Element, HSLA, Matrix, Point, PointList, ReactComponent, Rect, RGBA, Size, SVG, Timer, TRBL, Tree });
}

export class RootStore {
  entries = observable.array([]);

  @observable
  state = {
    articles: [],
    updated: false,
    mirrored: false,
    angle: 0,
    subpage: 0,
    loading: false,
    authenticated: false,
    error: undefined
  };

  auth = observable.object({
    user_id: "",
    token: ""
  });

  images = observable.map();
  entries = observable.array([]);
  users = observable.map();

  api = getAPI();

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
      window.rs = this;

      set(this.auth, JSON.parse(localStorage.getItem("auth")));
    }
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
    /*    for(let key in obj) {

      extendObservable(this.state, { key: obj[key] });
      //      this.state[key] = obj[key];
    }
*/ this.state.updated = true;
    console.log("RootStore.updateState ", obj);
  }

  @action.bound
  setState(obj) {
    set(this.state, obj);

    /*    console.log("RootStore.setState ", obj);
     */
  }

  @action.bound
  newImage(imageObj) {
    const { id, ...photo } = imageObj;

    return this.images.set(id, photo);
  }

  @action.bound
  newEntry(imageId) {
    let image = this.images.get(imageId);
    console.log("newEntry: ", { image });
    let entry = { image: { ...image, id: imageId } };
    this.entries.push(entry);
    return entry;
  }

  async fetchPhotos(where = {}) {
    let response = await this.api.list("photos", ["id", "original_name", "width", "height", "uploaded", "filesize", "user_id", "items { id }"], where);

    console.log("fetchPhotos =", response);

    return response;
  }

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

  async apiRequest(endpoint, data) {
    let res;

    console.log("RootStore.apiRequest " + endpoint, data);

    if(!data) res = await axios.get(endpoint);
    else res = await axios.post(endpoint, data);

    console.log("RootStore.apiRequest " + endpoint, " = ", await res.data);

    return await res;
  }

  @action.bound
  doLogin(username, password, completed = () => {}) {
    this.setState({ loading: true });

    Timer.once(100, () => {
      this.apiRequest("/api/login", { username, password }).then(res => {
        const { success, token, user_id, user } = res.data;
        const { username } = user;

        this.setState({ loading: false, authenticated: success, error: success ? undefined : "Login failed" });

        this.users.set(user_id, user);

        /*   this.auth.token = token;
        this.auth.user_id = user_id;*/
        this.disableAutoRun();
        let newAuth = { token, user_id, user };
        set(this.auth, newAuth);

        if(global.window) localStorage.setItem("auth", JSON.stringify(newAuth));

        this.enableAutoRun();

        console.log("API login result: ", { success, token });

        if(success && window.global) {
          for(let name of ["token"]) document.cookie += `${name}=${res.data[name]}; Path=/; `;
          console.log("Cookies: ", document.cookie);
        }

        completed(res.data);
      });
    });
  }

  @action.bound
  doLogout(completed = () => {}) {
    this.setState({ loading: true });
    this.apiRequest("/api/logout").then(res => {
      const { success, token, user_id } = res.data;
      this.setState({ loading: false, authenticated: false });
      //      this.disableAutoRun();
      set(this.auth, { token: "", user_id: -1 });
      this.auth.token = "";
      this.auth.user_id = -1;
      localStorage.removeItem("auth");
      //    this.enableAutoRun();
      completed();
    });
  }
}

export const singleton = new RootStore();

export default RootStore;
