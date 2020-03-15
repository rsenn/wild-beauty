import { observable, action } from "mobx";

export class EditorStore {
  constructor(initialData, pageProps) {
    // super(props);

    //console.log("EditorStore.constructor", { initialData, pageProps });

    if(global.window) {
      window.es = this;
    }

    this.reset();
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
    this.tree = root;
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
