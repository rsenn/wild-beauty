import React from "react";
import { action, observable, flow, set, get, values, computed } from "mobx";
import getAPI from "../utils/api.js";
import { Timer } from "../utils/dom.js";
import axios from "axios";
import { makeAutoStoreHandler, getLocalStorage, logStoreAdapter } from "./autoStore.js";

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

  constructor(initialData) {
    for(let k in initialData) this[k] = observable(initialData[k]);

    if(global.window) set(this.auth, JSON.parse(localStorage.getItem("auth")));

    this.enableAutoRun();

    const { auth, state } = this;

    //    console.log("RootStore.constructor ", { auth, state });
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

  @computed
  get authenticated() {
    return this.auth.token && this.auth.token.length > 0;
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

  fetchArticles = flow(function*(page = window.location.href.replace(/.*\//g, "")) {
    // <- note the star, this a generator function!
    this.result = "pending";
    let articles;
    //   let promise = new Promise(async function(resolve, reject) {
    try {
      articles = yield getAPI()(`
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
    let result = await getAPI()(`
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
        const { success, token, user_id } = res.data;

        this.setState({ loading: false, authenticated: success, error: success ? undefined : "Login failed" });
        /*   this.auth.token = token;
        this.auth.user_id = user_id;*/
        this.disableAutoRun();
        let newAuth = { token, user_id };
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
      //    this.enableAutoRun();
      completed();
    });
  }
}

export const singleton = new RootStore();

export default RootStore;
