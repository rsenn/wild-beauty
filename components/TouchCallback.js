import React, { Component } from "react";
import { Element } from "../utils/dom.js";
export const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")]
    .map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined))
    .filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

export const TouchCallback = event => {
  const { cancel } = event;
  let zIndex = maxZIndex();
  if(event.type == "touchstart") {
    zIndex++;
    e = event.start.target;
  } else if(event.start) {
    e = event.start.target;
  }

  const hasLayerClass = containsClass("layer");
  if(hasLayerClass) {
    while(e && e.parentElement && e.classList) {
      if(event.type.endsWith("start")) if (e && e.classList) e.classList.add("dragging");
      if(event.type.endsWith("end")) if (e && e.classList) e.classList.remove("dragging");
      if(e.classList.contains("layer")) break;
      e = e.parentElement;
    }
  }

  if((e.tagName && e.tagName.toLowerCase() == "html") || !hasLayerClass) {
    return cancel();
  }

  if(e) Element.setCSS(e, { zIndex });
  if(e.style) {
    e.style.setProperty(
      "transform",
      event.type.endsWith("move") ? `translate(${event.x}px, ${event.y}px)` : ""
    );
  }

  console.log(event.type + " event: ", { event, e });
};

export default TouchCallback;
