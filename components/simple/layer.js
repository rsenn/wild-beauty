import React, { useRef } from "react";
import { assign_to } from "../../lib/devtools.js";
import { trkl } from "../../lib/trkl.js";
import { Size, Rect, Element } from "../../lib/dom.js";
import { lazyInitializer } from "../../lib/lazyInitializer.js";
import { SvgOverlay } from "../../lib/svg/overlay.js";

if("window" in global) {
  assign_to(window);
  window.layers = [];
}

export function Layer({ style, inline, flex, children, border, margin, padding, background, overflow = "visible", opacity, x, y, w, h }) {
  var rect = w && h ? new Rect({ x: 0, y: 0, width: w, height: h }) : new Rect();
  var refContainer = useRef(null);
  var handler = trkl();
  var ref = {
    get current() {
      return handler();
    },
    set current(value) {
      handler(value);
    }
  };
  var dt = flex ? "flex" : "block";
  var st = {
    ...style,
    border,
    margin,
    background,
    overflow,
    opacity,
    display: (inline ? "inline-" : "") + dt,
    padding
  };
  var box = lazyInitializer(() => Element.rect(ref.current));
  var client = lazyInitializer(() => {
    return "window" in global ? new Size(window.innerWidth, window.innerHeight) : new Size({ width: 0, height: 0 });
  });
  /*  box.subscribe(rect => {
  });
*/ handler.subscribe(e => {
    //console.log('Element: ', e);
    do {
      box(Element.rect(e));
    } while(0); //(e = e.parentNode));
    //console.log("layer element: ", { box, client });
  });

  if(!st.position) st.position = "relative";
  if(Size.area(box) > 0) {
    if(!st.minWidth && !st.minHeight) {
      st.minWidth = rect.width;
      st.minHeight = rect.height;
    }
    if(!st.maxWidth && !st.maxHeight) {
      st.maxWidth = rect.width;
      st.maxHeight = rect.height;
    }
  }

  return (
    <React.Fragment>
      <div ref={ref} className='layer' style={st}>
        <div className='layout'>{children}</div>
        <SvgOverlay className={"svg"} />
      </div>
      <style jsx>
        {`
          .layer {
            position: relative;
            box-sizing: content-box;
            text-align: center;
            vertical-align: middle;
          }
          .layout {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: auto;
          }
          .layout > * {
            flex: 1 1 auto;
          }
          .svg {
            position: absolute;
            left: 0;
            top: 0;
          }
        `}
      </style>
    </React.Fragment>
  );
}

export default Layer;
