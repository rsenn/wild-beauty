import React, { Component } from "react";
import { Node, Element } from "../lib/dom.js";

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
  const hasLayerClass = className.startsWith("#") ? e => `#${e.getAttribute("id")}` == className : e => containsClass(className)(e);

  if(action === null) action = defaultTouchAction;

  return event => {
    const { cancel } = event;

    let e;
    if(event.type.endsWith("start")) {
      if(event.button != 0 && typeof cancel == "function") return cancel();

      e = event.target;
    } else if(event.start) {
      e = event.start.target;
    }

    const depth = Node.depth(e);

    //    if(depth <= 5) return  typeof cancel == "function" ? cancel() : null;

    //console.log("TouchCallback event: ", { depth, event, cancel });

    if(hasLayerClass) {
      let element = e;
      while(element && element.parentElement && element.classList) {
        if(event.type.endsWith("start")) if (element && element.classList) element.classList.add("dragging");
        if(event.type.endsWith("end")) if (element && element.classList) element.classList.remove("dragging");
        if(true /*element.classList.contains(className)*/) break;
        element = element.parentElement;
      }
    }

    if((e && e.tagName && e.tagName.toLowerCase() == "html") || !hasLayerClass) {
      if(typeof cancel == "function") return cancel();
    }

    if(hasLayerClass) action(event, e);

    //console.log(event.type + " event: ", { event, e });
  };
};

export const DrawCallback = svgRef => ({
  start(event) {
    const { x, y, client, page } = event;
    console.log("touch start: ", event, { x, y });

    const f = svgRef().factory;
    if(f) {
      this.g = f("g", { stroke: "#ff0", fill: "none", strokeWidth: 8, transform: `translate(${client.x}, ${client.y})` }, svgRef().svg);
      this.path = f("path", { d: "", style: "paint-order:markers stroke fill" }, this.g);
      this.pathData = `M${x},${y}`;
      page.path = this.path;
      console.log("new Path: ", this.path);
    }
    this.x = x;
    this.y = y;
    this.origin = client;
  },
  end(event) {
    const { x, y } = event;
    console.log("touch end: ", { x, y });
  },
  move(event) {
    const { x, y, distance } = event;
    const callers = Util.getCallerFunctionNames(1, 50);
    console.log("touch move: ", { x, y, callers });

    const rel = this.relxy(x, y);

    if(Math.abs(rel.x) + Math.abs(rel.y) > 3) {
      this.pathData += ` l${rel.x.toFixed(3)},${rel.y.toFixed(3)}`;
      this.path.setAttribute("d", this.pathData);
      this.setxy(x, y);
    }
  },
  cancel(event) {},
  setxy(x, y) {
    this.x = x;
    this.y = y;
  },
  relxy(x, y) {
    return { x: x - this.x, y: y - this.y };
  }
});

export const TouchCallback = makeTouchCallback();

export default TouchCallback;
