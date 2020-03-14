import { RootStore } from "./RootStore.js";
import { EditorStore } from "./EditorStore.js";
import Util from "../lib/util.js";
import { useStaticRendering } from "mobx-react";

const isServer = typeof global.window === "undefined";

useStaticRendering(isServer);

var appStores = {
  RootStore,
  EditorStore
};

var count = 0;
var stores = null;
var store = null;
var root = null;

export function createStore(isServer = false, preFetchObj = {}, pageProps = {}) {
  root = null;
  return Object.keys(appStores).reduce((acc, storeName) => {
    //CommonStoreFunctions.decorate(appStores[storeName]);
    let instance = !isServer && store !== null ? store : new appStores[storeName](preFetchObj, pageProps);
    appStores[storeName].singleton = instance;
    //CommonStoreFunctions.mixin(instance);
    return { ...acc, [storeName]: instance };
  }, {});
}

export function getOrCreateStore(isServer = false, preFetchObj = {}, pageProps = {}) {
  if(stores == null || count == 0) {
    ///  console.log("getOrCreateStore.callers", Util.getCallers());
    console.log("getOrCreateStore", { count: count++, isServer, preFetchObj: Object.keys(preFetchObj), pageProps: Object.keys(pageProps) });

    stores = createStore(isServer, preFetchObj, pageProps);
    //CommonStoreFunctions.getStore = name => appStores[name].singleton;
  }
  // Always make a new store if server, otherwise state is shared between requests
  if(!Util.isBrowser()) {
    return stores;
  }
  if(window !== undefined) {
    const __NEXT_MOBX_STORE__ = "__NEXT_MOBX_STORE__";
    // Create store if unavailable on the client and set it on the window object
    if(!window[__NEXT_MOBX_STORE__]) {
      window[__NEXT_MOBX_STORE__] = stores;
    }
  }
  return stores;
}

export function getStore(name) {
  const stores = getOrCreateStore();
  return stores ? stores[name] : null;
}

export function getStores() {
  return getOrCreateStore();
}

export default getOrCreateStore;
