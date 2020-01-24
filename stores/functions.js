import {  toJS } from "mobx";


export const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

export const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")]
    .map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined))
    .filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

export const makeItemToOption = selected => item => {
  let data = (item && item.data) || {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label, title: label, value, expanded: true, checked: selected === value };

  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  if(!data.name) if (!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;

  return obj;
};

export const findInTree = (tree, value) => {
  if(tree.value === value || tree.label === value) return tree;
  if(tree.children) {
    for(let child of tree.children) {
      let ret = findInTree(child, value);
      if(ret !== null) return ret;
    }
  }
  return null;
};
