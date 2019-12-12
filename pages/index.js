import React, { useState } from "react";
import Head from "next/head";
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
import { action, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { Article } from "../components/views/article.js";
import LoginForm from "../components/login.js";
import timeSpanFormat from 'time-span-format';

import tims from "tims";

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

@inject("rootStore")
@observer
class Home extends React.Component {
  state = {
    mirrored: false,
    angle: 0
  };

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

    var counter = 0;

    Timer.interval(1000, () => {
      rootStore.setState({
        mirrored: counter % 3 == 0 ? !rootStore.state.mirrored : rootStore.state.mirrored,
        angle: (counter / 3) % 360
      });
      counter++;
      /*  this.setState({ mirrored: !this.state.mirrored });*/
      this.forceUpdate();
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

    const { rootStore } = this.props;
 
    const t = ` perspective(100vw) scaleX(${rootStore.state.mirrored ? -1 : 1})`; // `rotateZ(${rootStore.state.angle}deg) ` + (rootStore.state.mirrored ? " rotateY(-180deg) " : "");

    const endDate = new Date("01.01.2035");

    const now = new Date();

const seconds = (endDate.getTime() - now.getTime()) / 1000;
    //const timespan = tims.text(, {    lang: "fr"   }); /*.split(/,/g).slice(0, 2).join(', ')*/
    const timespan = timeSpanFormat(Math.floor(seconds));

   // console.log("Home.render", { t, timespan });

    return (
      <div className={"main-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {/*        <Nav />
         */}
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
          <a className={'button-next'}><img src={"static/img/arrow-next.svg"} /></a>

        {/*        {rootStore.state.updated}
        <div className={"page-layout"}>
          <div className={"article-list"}>
            {articles.map(article => (
              <Article {...article} />
            ))}
          </div>
        </div>
*/}
        {/*  <Layer w={300} h={'300px'} margin={10} padding={2} border={'2px dashed red'}>
        Layer
      </Layer>
      <SvgOverlay />*/}
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
          .main-layout {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
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
