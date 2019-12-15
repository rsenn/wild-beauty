import React, { Component } from "react";
import { Element } from "../utils/dom.js";

export const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};
export const containsClass = className => {
  return e => [...Node.parents(e)].some(item => item && item.classList && item.classList.contains(className || "layer"));
};

export const defaultTouchAction = (event, e) => {
  const zIndex = maxZIndex() + 1;
  if(e) Element.setCSS(e, { zIndex });
  if(e && e.style) {
    e.style.setProperty("transform", event.type.endsWith("move") ? `translate(${event.x}px, ${event.y}px)` : "");
  }
};

export const makeTouchCallback = (className = "layer", action = null) => {
  if(action === null) action = defaultTouchAction;

  return event => {
    const { cancel } = event;
    let e;
    if(event.type == "touchstart") {
      if(event.button != 0 && typeof cancel == "function") return cancel();

      e = event.target;
    } else if(event.start) {
      e = event.start.target;
    }

    //console.log("TouchCallback event: ", event);

    const hasLayerClass = containsClass(className);
    if(hasLayerClass) {
      while(e && e.parentElement && e.classList) {
        if(event.type.endsWith("start")) if (e && e.classList) e.classList.add("dragging");
        if(event.type.endsWith("end")) if (e && e.classList) e.classList.remove("dragging");
        if(e.classList.contains(className)) break;
        e = e.parentElement;
      }
    }

    if((e && e.tagName && e.tagName.toLowerCase() == "html") || !hasLayerClass) {
      if(typeof cancel == "function") return cancel();
    }

    action(event, e);

    // console.log(event.type + " event: ", { event, e });
  };
};

export const TouchCallback = makeTouchCallback();

export default TouchCallback;
