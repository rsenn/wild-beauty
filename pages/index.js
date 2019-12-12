import React, { useState } from "react";
import Head from "next/head";
import { withRouter } from "next/router";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../utils/scrollController.js";
import Alea from "../utils/alea.js";
import { SwipeTracker } from "../utils/swipeTracker.js";
import { Element, Node, HSLA, Timer } from "../utils/dom.js";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { TouchCallback } from "../components/TouchCallback.js";
import getAPI from "../utils/api.js";
import { action, toJS, autorun } from "mobx";
import { inject, observer } from "mobx-react";
import { Article } from "../components/views/article.js";
import LoginForm from "../components/login.js";
import timeSpanFormat from "time-span-format";

import tims from "tims";

import "../static/style.css";

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

@inject("rootStore")
@observer
@withRouter
class Home extends React.Component {
  state = {
    mirrored: false,
    angle: 0
  };

  constructor(props) {
    super(props);

    const { rootStore } = this.props;
    rootStore.setState({ subpage: 1 });

    if(global.window) {
      global.window.page = this;
      global.window.rs = rootStore;
    }

    this.getHash();

    autorun(() => {
      console.log("rootStore.state = ", toJS(rootStore.state));
    });
  }

  getHash() {
    const { rootStore, router } = this.props;

    if(global.window) {
      const hash = /#/.test(window.location.href) ? window.location.href.replace(/.*#/, "") : "1";
      //  console.log("hash: ", hash);
      const subpage = parseInt(hash);
      if(!isNaN(subpage)) {
        if(subpage != rootStore.state.subpage) {
         rootStore.setState({ subpage });
              this.forceUpdate();
        }
      }
    }
  }
  /**
   * { function_description }
   */
  componentDidMount() {
    const { rootStore, router } = this.props;
    console.log("Home.componentDidMount ");
    rootStore.loadArticles("home").then(result => {
      let articles = Util.findVal(result, "items");
      console.log("Home fetched", { result, articles });
      {
        //        rootStore.setState({ articles: toJS(res) });
        rootStore.updateState({ articles });
      }
    });

this.getHash();

    var counter = 0;

    Timer.interval(1000, () => {
      counter++;
      if(counter % 3 == 0) {
        rootStore.setState({
          mirrored: !rootStore.state.mirrored
        });
      }
      this.forceUpdate();
    });
  }

  handleNext = () => {
    const { rootStore } = this.props;

    rootStore.setState({ subpage: rootStore.state.subpage + 1 });
    this.forceUpdate();
  };

  handlePrev = () => {
    const { rootStore } = this.props;

    rootStore.setState({ subpage: rootStore.state.subpage - 1 });
    this.forceUpdate();
  };

  render() {
    const { rootStore, router } = this.props;

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

    this.getHash();

    const t = ` perspective(100vw) scaleX(${rootStore.state.mirrored ? -1 : 1})`; // `rotateZ(${rootStore.state.angle}deg) ` + (rootStore.state.mirrored ? " rotateY(-180deg) " : "");
    const endDate = new Date("01.01.2035");
    const now = new Date();
    const seconds = (endDate.getTime() - now.getTime()) / 1000;
    //const timespan = tims.text(, {    lang: "fr"   }); /*.split(/,/g).slice(0, 2).join(', ')*/
    const timespan = timeSpanFormat(Math.floor(seconds));
    const subpage =   toJS(rootStore.state.subpage);
    console.log("Home.render", { t, timespan, subpage });
    return (
      <div className={"main-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className={"subpage"} style={{ opacity: subpage == 1 ? 1 : 0, display: subpage == 1 ? "flex" : "flex" }}>
          <div
            style={{
              //   transition: "transform 1s ease-in",
              transformStyle: "preserve-3d",
              transform: t
            }}
          >
            <img
              src={"static/img/logo-transparent.png"}
              style={{
                width: "100%",
                maxWidth: "1280px"
                /*            height: "auto",
                 */
              }}
            />
          </div>
          <div className={"time-counter"}>{timespan}</div>
          {/*  <img src={"static/img/arrow-next.svg"} style={{ transform: 'scaleX(-1)' }} />*/}
        </div>
        <div className={"subpage"} style={{ opacity: subpage == 2 ? 1 : 0, display: subpage == 2 ? "flex" : "flex" }}></div>
        <div className={"subpage"} style={{ opacity: subpage == 3 ? 1 : 0, display: subpage == 3 ? "flex" : "flex" }}></div>
        {subpage > 1 ? (
          <a className={"button-prev"} href={"#" + (subpage - 1)} onClick={this.handlePrev}>
            <img src={"static/img/arrow-next.svg"} style={{ transform: "scaleX(-1)" }} />
          </a>
        ) : (
          undefined
        )}
        <a className={"button-next"} href={"#" + (subpage + 1)} onClick={this.handleNext}>
          <img src={"static/img/arrow-next.svg"} />
        </a>
        <style jsx global>{`
          .article-list {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .button-next {
            position: absolute;
            right: 10px;
            bottom: 10px;
          }
          .button-prev {
            position: absolute;
            left: 10px;
            bottom: 10px;
          }
          .button-next,
          .button-prev {
            filter: drop-shadow(-2px 2px 4px #00000080);
          }
          .button-next:active,
          .button-prev:active {
            transform: translate(2px, 2px);
          }
          .subpage {
            position: absolute;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            transition: opacity 0.5s;
          }

          .main-layout {
            width: 100%;
            height: 100vh;

            padding: 0;
            margin: 0;
          }
          .time-counter {
            margin: 10px;
            font-size: 2em;
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

export default Home;
