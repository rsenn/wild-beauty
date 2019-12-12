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
import getAPI from "../utils/api.js";
import { action, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { Article } from "../components/views/article.js";

import "../static/style.css";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")]
    .map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined))
    .filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { rootStore } = this.props;

    console.log("Home.componentDidMount ");

    rootStore.loadArticles("home").then(result => {
      let articles = Util.findVal(result, "items");
      console.log("Home fetched", { result, articles });
      {
        //        rootStore.setState({ articles: toJS(res) });
        rootStore.updateState({ articles });
      }
    });
  }

  render() {
    let swipeEvents = {};
    var e = null;

    if(global.window !== undefined) window.page = this;

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
    /*   const onError = event => {};

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
      ];*/
    const { rootStore } = this.props;

    let articles = toJS(rootStore.state.articles);

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
    });
    return (
      <div className={"main-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav />
                  <img src={'static/img/logo-transparent.png'} style={{ marginLeft: '20px', marginTop: '150px', width: '100vw', maxWidth: '480px', height: 'auto' }} />

        {rootStore.state.updated}
        <div className={"page-layout"}>
          <div className={"article-list"}>
            {articles.map(article => (
              <Article {...article} />
            ))}
          </div>
        </div>

        {/*  <Layer w={300} h={'300px'} margin={10} padding={2} border={'2px dashed red'}>
        Layer
      </Layer>
      <SvgOverlay />*/}
        <style jsx global>{`
          .article-list {
            margin: auto;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
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
    );
  }
}

export default inject("rootStore")(observer(Home));
