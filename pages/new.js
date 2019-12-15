import React, { useState } from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../utils/scrollController.js";
import Alea from "../utils/alea.js";
import { SwipeTracker } from "../utils/swipeTracker.js";
import { Element, Node, HSLA } from "../utils/dom.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { TouchCallback, makeTouchCallback, maxZIndex } from "../components/TouchCallback.js";
import { toJS, autorun } from "mobx";
import { inject, observer } from "mobx-react";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { createStore, getOrCreateStore } from "../stores/createStore.js";
import NeedAuth from "../components/simple/needAuth.js";
import { Translate, Localize } from "react-i18nify-mobx";
import { WrapInAspectBox, SizedAspectRatioBox } from "../components/simple/aspectBox.js";

import UploadImages from "react-upload-gallery";
import "../static/css/react-upload-gallery.css";

import "../static/style.css";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

@inject("rootStore")
@observer
class New extends React.Component {
  static async getInitialProps(ctx) {
    const { RootStore } = ctx.mobxStore;

    let photos = await RootStore.fetchPhotos();
    console.log("photos:", photos);

    photos.forEach(item => RootStore.newImage(item));
  }

  constructor(props) {
    let args = [...arguments];
    const { rootStore } = props;
    //    console.log("constructor args: ", props.initialMobxState.RootStore.images);
    console.log("rootStore: ", toJS(rootStore.images));
    super(props);

    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      //    window.stores = getOrCreateStore();
    }

    let swipeEvents = {};
    var e = null;

    if(global.window !== undefined) {
      window.page = this;
      window.rs = rootStore;
    }

    if(global.window) {
      this.touchCallback = makeTouchCallback("inner-image", (event, e) => {
        const zIndex = maxZIndex() + 1;
        if(e) Element.setCSS(e, { zIndex });
        if(e && e.style) {
          const orientation = e.getAttribute("orientation");
          console.log("img ", { orientation });

          let transformation = orientation == "landscape" ? `translateX(${event.x}px)` : `translateY(${event.y}px)`;

          e.style.setProperty("transform", event.type.endsWith("move") ? transformation : "");
        }
      });

      this.touchListener = TouchListener(
        e => {
          if(e.nativeEvent) e.nativeEvent.preventDefault();

          this.touchCallback(e);
        },
        {
          element: global.window,
          step: 1,
          round: true,
          listener: MovementListener,
          noscroll: true
        }
      );
      window.dragged = e;
      MultitouchListener(
        event => {
          console.log("multitouch", event);
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );
    }
  }

  render() {
    const { rootStore } = this.props;
    /*   if(global.window !== undefined) window.page = this;
    if(global.window) {
      var touchListener = TouchListener(TouchCallback, {
        element: global.window,
        step: 1,
        round: true,
        listener: MovementListener,
        noscroll: true
      });
      MultitouchListener(
        event => {
          console.log("multitouch", event);
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );
    }*/
    const onError = event => {};

    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      console.log("onChange: ", value);
    }; /*

  const state = {
    image: useState(""),
    error: useState(0)
  };*/
    let list = imagePaths();
    if(list === null || (list && list.length == undefined))
      list = [
        "static/img/86463ed8ed391bf6b0a2907df74adb37.jpg",
        "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg",
        "static/img/cdb466a69cc7944809b20e7f34840486.jpg",
        "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg",
        "static/img/fdcce856cf66f33789dc3934418113a2.jpg"
      ];

    /*  let articles = toJS(rootStore.state.articles);

  if(articles.length === undefined) articles = [];
  console.log("Home.render ", { articles });
  articles = articles.map(art => {
    const { type, id, page_id, data } = art;
    const json = JSON.parse(data);
    console.log("json: ", json);
    json.type = art.type;
    json.id = art.id;
    json.page_id = art.page_id;
    return json;
  });*/

    return (
      <div className={"panes-layout"} {...TouchEvents(this.touchListener)}>
        <Head>
          <title>New</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav />
        <div className={"page-layout"}>
          <NeedAuth>
            <div
              className={"upload-area"}
              style={{
                minWidth: "80vmin",
                minHeight: "80vmin"
              }}
            >
              <UploadImages
                action="/api/image/upload" // upload route
                source={response => {
                  return response.map(item => {
                    const { id } = item;
                    const url = `/api/image/get/${id}.jpg`;
                    console.log("UploadImages response:", { item, url });
                    rootStore.newImage(item);
                    return url;
                  })[0];
                }}
                onSuccess={arg => {
                  const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
                  console.log("UploadImages success:", arg);

                  let entry = rootStore.newEntry(id);
                  arg.remove();

                  console.log("UploadImages success:", entry);
                }}
              ></UploadImages>
            </div>
            <div className={"image-list"}>
              {[...rootStore.images.entries()].map(([id, image]) => {
                const { width, height } = image;
                const landscape = width > height;

                return (
                  <div className={"item-entry"}>
                    <SizedAspectRatioBox className={"item-box"}>
                      <img
                        className={"inner-image"}
                        src={`/api/image/get/${id}.jpg`}
                        width={width}
                        height={height}
                        orientation={landscape ? "landscape" : "portrait"}
                        style={{
                          width: landscape ? `${(width * 100) / height}%` : "100%",
                          height: landscape ? "100%" : "auto"
                        }}
                      />
                    </SizedAspectRatioBox>
                  </div>
                );
              })}
            </div>
            {/*<div className={"panes-list"}>
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
          </div>*/}

            <Layer w={300} h={"300px"} margin={10} padding={20} border={"2px dashed red"} style={{ cursor: "move" }}>
              Layer
            </Layer>
            <SvgOverlay />
          </NeedAuth>

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
            div.upload-area > div,
            div.upload-area > div > div,
            div.upload-area > div > div > div {
              position: relative;
              display: block;
              width: 100%;
              height: 100%;
            }
            .item-entry {
              margin: 10px;
            }
            .item-box-size {
              border: 1px solid black;
              box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.75);
              box-sizing: border-box;
            }

            .aspect-ratio-box {
              overflow: hidden;
            }
            .image-list {
              display: inline-flex;
              flex-flow: row wrap;
              flex-basis: 30%;
              justify-content: center;
            }
            .image-list > div {
              flex: 0 1 auto;
              width: 30vw;
            }
          `}</style>
        </div>
      </div>
    );
  }
}

export default New;
