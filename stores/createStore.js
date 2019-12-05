import { RootStore } from "./RootStore.js";
import Util from "../utils/util.js";

export let appStores = {
  RootStore
};

export let stores = null;
let store = null;
let root = null;

export function createStore(isServer = false, preFetchObj = {}, pageProps = {}) {
  root = null;
  return Object.keys(appStores).reduce((acc, storeName) => {
    //CommonStoreFunctions.decorate(appStores[storeName]);
    let instance = !isServer && store !== null ? store : new appStores[storeName](isServer, preFetchObj, pageProps);
    appStores[storeName].singleton = instance;
    //CommonStoreFunctions.mixin(instance);
    return { ...acc, [storeName]: instance };
  }, {});
}

export function getOrCreateStore(isServer = false, preFetchObj = {}, pageProps = {}) {
  if(stores == null) {
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
  const store = stores ? stores[name] : null;
  return store;
}
export function getStores() {
  return getOrCreateStore();
}

export default getOrCreateStore;
