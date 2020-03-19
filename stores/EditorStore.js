import { observable, action } from "mobx";

export class EditorStore {
  @observable parent = {};
  @observable tree = {};
  @observable state = {
    parent: -1
  };

  constructor(initialData, pageProps) {
    // super(props);

    //console.log("EditorStore.constructor", { initialData, pageProps });

    if(global.window) {
      window.es = this;
    }

    this.reset();
  }

  @action
  setState(state) {
    for(let prop in state) {
      this.state[prop] = state[prop];
    }
  }

  @action
  reset() {
    this.fields = observable.array([]);
    this.types = observable.map({});
    this.values = observable.map({});
    this.editing = false;

    this.addField("Name");
    this.addField("Title");
    this.addField("Text");
  }

  @action
  setTree(root) {
    console.log("editorStore.setTree", { root });
    this.tree = observable(root);
  }

  @action
  changeTree(value, fn = item => {}) {
    let results = [...Util.walkTree(es.tree)].filter(typeof value == "function" ? value : node => node.value == value);
    results.forEach(fn);
    return results[0];
  }

  @action
  loadItem(item) {
    this.editing = true;
  }

  @action
  addField(label, type = "string", value = "") {
    this.fields.push(label);
    this.types.set(label, type);
    this.values.set(label, value);
  }

  @action
  setField(label, value = "") {
    this.values.set(label, value);
  }

  @action
  removeField(label) {
    this.fields.remove(label);
    this.types.remove(label);
    this.values.remove(label);
  }

  getFields() {
    return this.fields.map(label => {
      const name = label.toLowerCase();
      const type = this.types.get(label);
      const value = this.values.get(label);
      return { label, name, type, value };
    });
  }

  getValue(label) {
    return this.values.get(label);
  }
}

export default EditorStore;
