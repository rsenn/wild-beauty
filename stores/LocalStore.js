import { observable } from "mobx";

export class LocalStore {
  store = LocalStore.foarseobservableStorage();

  static observableStorage() {
    const state = {};
    if(global.localStorage) {
      for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        state[key] = parseValue(localStorage.getItem(key));
      }
    }
    return observable.map(state);
  }

  get size() {
    return this.store.size;
  }

  has(key) {
    return this.store.has(key);
  }

  /**
   * @param {string} key
   * @param {string|number|object} defaultValue
   * @returns {*}
   */
  get(key, defaultValue) {
    const value = this.store.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * @param {string} key
   * @param {string|number|object} v
   * @returns {*}
   */
  set(key, v) {
    localStorage.setItem(key, JSON.stringify(v));
    this.store.set(key, v);
    return v;
  }

  /**
   * @param {string} key
   * @returns {*}
   */
  remove(key) {
    localStorage.removeItem(key);
    this.store.delete(key);
  }

  clear() {
    localStorage.clear();
    this.store.clear();
  }

  keys() {
    return this.store.keys();
  }

  values() {
    return this.store.values();
  }

  entries() {
    return this.store.entries();
  }

  forEach(callback) {
    return this.store.forEach(callback);
  }

  map(callback) {
    return [...this.store.entries()].map(x => callback(x[1]));
  }
}

function parseValue(value) {
  try {
    return JSON.parse(value);
  } catch(e) {
    return value;
  }
}

function isNumber(str) {
  return !isNaN(parseInt(str, 10));
}

export default LocalStore;

