import React from "react";
import { action, observable, flow, set, get, values } from "mobx";
import getAPI from "../utils/api.js";

export class RootStore {
  entries = observable.array([]);

  state = observable({
    articles: [],
    updated: false
  });

  constructor() {}

  updateState = action(function(obj) {
    set(this.state, obj);
    /*    for(let key in obj) {

      extendObservable(this.state, { key: obj[key] });
      //      this.state[key] = obj[key];
    }
*/ this.state.updated = true;
    console.log("RootStore.updateState ", obj);
  });

  setState = action(function(obj) {
    set(this.state, obj);

    console.log("RootStore.setState ", obj);
  });

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
}

export default RootStore;
