import { autorun, toJS } from "mobx";

export const makeLocalStorage = () => {
  if(global.window && window.localStorage)
    return {
      get: name => JSON.parse(localStorage.getItem(name)),
      set: (name, data) => localStorage.setItem(name, JSON.stringify(data)),
      remove: name => localStorage.removeItem(name)
    };
  return {
    get: name => ({}),
    set: (name, data) => undefined,
    remove: name => undefined
  };
};

export const logStoreAdapter = store => {
  return {
    store,
    get: function(name) { console.log(`logStoreAdapter.get(${name}`); return this.store.get(name); },
    set: function(name,data)  { console.log(`logStoreAdapter.set(${name},`,data,')'); return this.store.set(name,data); },
   remove: function(name) { console.log(`logStoreAdapter.remove(${name}`); return this.store.remove(name); },
 }
}

export const makeLocalStore = name => ({
  name,
  storage: makeLocalStorage(),
  get() {
    console.log(`localStore[${this.name}].get()`);
    return this.storage.get(this.name);
  },
  set(data) {
    console.log(`localStore[${this.name}].set(data)`);

    return this.storage.set(this.name, data);
  },
  remove() {
    console.log(`localStore[${this.name}].remove()`);

    return this.storage.remove(this.name);
  }
});

export const makeDummyStorage = () => ({
  get: name => null,
  set: (name, data) => {},
  remove: name => {}
});

export function getLocalStorage() {
  if(getLocalStorage.store === undefined) {
    getLocalStorage.store = global.window && window.localStorage ? makeLocalStorage() : makeDummyStorage();
  }
  return getLocalStorage.store;
}

export const makeAutoStoreHandler = (name, store) => {
  if(!store)
  store = getLocalStorage();
  return (_this, _member) => {
    let firstRun = false; //true;
    // will run on change
    const disposer = autorun(() => {
      // on load check if there's an existing store on localStorage and extend the store
      if(firstRun) {
        const existingStore = store.get(name);
        if(existingStore) {
          _this[_member] = existingStore;
        }
      }
      const updatedStore = _this[_member];

      console.log("AutoStoreHandler: ", {
        name,
        obj: toJS(_this),
        key: _member,
        value: toJS(updatedStore)
      });

      if(updatedStore) {
        store.set(name, toJS(updatedStore));
      } else {
        store.remove(name);
      }
    });
    firstRun = false;
    return disposer;
  };
};
