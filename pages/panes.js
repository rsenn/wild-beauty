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
import RUG from "react-upload-gallery";
import "react-upload-gallery/dist/style.css";

import "../static/style.css";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const Panes = () => {
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
    list = [
      "static/img/86463ed8ed391bf6b0a2907df74adb37.jpg",
      "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg",
      "static/img/cdb466a69cc7944809b20e7f34840486.jpg",
      "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg",
      "static/img/fdcce856cf66f33789dc3934418113a2.jpg"
    ];

  return (
    <div className={"panes-layout"} {...TouchEvents(touchListener)}>
      <Head>
        <title>Panes</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <div className={"page-layout"}>
        <div
          style={{ position: "absolute", top: "15vh", left: "5vw", width: "80vw", height: "20vh" }}
        >
          <RUG
            action="/api/upload" // upload route
            source={response => response.source} // response image source
          />
        </div>
        <div className={"panes-list"}>
          <div className={"panes-item layer"}>
            <img src="static/img/63a5110bf12b0acef2f68e0e1a023502.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/76619287_430389744517453_4826291339341594624_n.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/69688821_689014168592533_7393339862767632384_n.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/d415b80a6007124c4e3948b21a7f0ed1.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/69536222_653691828474365_6429980850053447680_n.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/76771501_2539648529692993_599570957710917632_n.jpg" />
          </div>
          <div className={"panes-item layer"}>
            <img src="static/img/0c71247f63ff20833347da1484d3caa4.jpg" />
          </div>
        </div>

        {/*  <Layer w={300} h={'300px'} margin={10} padding={2} border={'2px dashed red'}>
        Layer
      </Layer>
      <SvgOverlay />*/}
        <style jsx global>{`
          .panes-list {
            display: flex;
            border: 1px solid black;
            position: relative;
            top: 90vh;
          }
          .panes-item {
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px dashed red;

            position: relative;
            flex: 0 0 auto;
            width: 20vw;
            height: 20vw;
            align-items: center;
            justify-content: center;
            overflow: auto;
          }
          .panes-item > img {
            width: 20vw;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Panes;
