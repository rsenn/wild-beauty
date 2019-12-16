import React, { useState } from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../utils/scrollController.js";
import Alea from "../utils/alea.js";
import { SwipeTracker } from "../utils/swipeTracker.js";
import { Element, Node, HSLA } from "../utils/dom.js";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { TouchCallback } from "../components/TouchCallback.js";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());
const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const Test = () => {
  let swipeEvents = {};
  var e = null;

  if(global.window !== undefined) window.page = this;
  /*
  var scrolling = new ScrollController();

  var swipeTracker = new SwipeTracker(10, function(event) {
    console.log(event.type+': ', event);
  });
  swipeEvents = swipeTracker.events;
*/

  if(global.window) {
    var touchListener = TouchListener(TouchCallback, {
      element: global.window,
      step: 1,
      round: true,
      listener: MovementListener,
      noscroll: true
    });
    window.dragged = e;
    MultitouchListener(
      event => {
        console.log("multitouch", event);
      },
      { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
    );
  }

  const onError = event => {};
  const onImage = event => {
    const { value } = event.nativeEvent.target;
    document.forms[0].submit();
    console.log("onChange: ", value);
  };
  const state = {
    image: useState(""),
    error: useState(0)
  };
  let list = imagePaths();
  if(list === null || (list && list.length == undefined))
    list = ["static/img/86463ed8ed391bf6b0a2907df74adb37.jpg", "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg", "static/img/cdb466a69cc7944809b20e7f34840486.jpg", "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg", "static/img/fdcce856cf66f33789dc3934418113a2.jpg"];
  return (
    <div className={"main-layout"} {...TouchEvents(touchListener)}>
      <Head>
        <title>Test</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <div className={"page-layout"}>
        {/*    <form action="upload" method="POST" onSubmit={e => e.preventDefault()}>
        <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()} style={{ width: "300px", height: "200px" }}>
                <input {...getInputProps()} style={{}} onChange={onImage} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
      </form>*/}
        <Gallery />
        <div
          className={"panels"}
          style={{
            overflow: "visible",
            display: "flex",
            flexFlow: "row wrap",
            justifyContent: "space-around",
            alignItems: "stretch",
            position: "absolute",
            maxWidth: "100%",
            maxHeight: "100%"
          }}
        >
          {list.map(path => (
            <Layer inline style={{ flex: "1 0 auto", backgroundColor: RandomColor() }}>
              <img src={path} style={{ maxWidth: "50vmin", width: "100%", height: "auto" }} className="gallery-image" />
            </Layer>
          ))}
        </div>
        <Layer className={"layer"} w={300} h={"300px"} margin={10} padding={2} border={"2px dashed red"}>
          Layer
        </Layer>
        <SvgOverlay />
        <style jsx global>{`
          .main-layout {
            overflow: hidden;
          }

          .gallery-image {
            height: auto;
          }

          .panels {
            margin: 100px;
            overflow: visible;
          }

          img {
            border: 0px;
            outline: 0px;
            padding: 0px;
            margin: 0px;
          }

          .panels .layer {
            margin: 0px;
            padding: 0px;
          }

          .layout {
            margin: 0px;
            padding: 0px;
            overflow: visible;
          }

          .panels > div {
            flex: 1 1 auto;
          }

          .layer > div {
            width: 100%;
            height: 100%;
          }

          .layer > div {
            width: 100%;
            height: 100%;
          }

          .layer.dragging {
            opacity: 50%;
          }

          .title {
            margin: 0;
            width: 100%;
            padding-top: 80px;
            line-height: 1.15;
            font-size: 48px;
          }

          .title,
          .description {
            text-align: center;
          }

          .row {
            max-width: 880px;
            margin: 80px auto 40px;
            display: flex;
            flex-direction: row;
            justify-content: space-around;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Test;
