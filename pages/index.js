import React from "react";
import Head from "next/head";
import { withRouter } from "next/router";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../utils/alea.js";
import { HSLA, Timer } from "../utils/dom.js";
import { MovementListener, TouchHandler } from "../utils/touchHandler.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import Util from "../utils/util.js";
import { DrawCallback } from "../components/TouchCallback.js";
import { inject, observer } from "mobx-react";
import { trkl } from "../utils/trkl.js";
import axios from "../utils/axios.js";
import { ColorScheme } from "../utils/colorscheme.js";

import tims from "tims";

import "../static/style.css";

const rng = Alea.singleton(Date.now());
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
//@withRouter
class Home extends React.Component {
  state = {
    mirrored: false,
    angle: 0
  };
  svgLayer = trkl();

  constructor(props) {
    super(props);
    const { rootStore } = this.props;
    rootStore.setState({ subpage: 1 });
    if(global.window) {
      window.page = this;
      window.rs = rootStore;
      window.rng = rng;
      window.axios = axios;
      const parser = new DOMParser();
      window.nt = parser.parseFromString(ColorScheme.nextTheme, "text/xml");
      window.EditColorScheme = ColorScheme.randomize;
      window.ColorSchemeToObject = ColorScheme.toObject;
    }
    this.getHash();

    /*    this.svgLayer.subscribe(newLayer => {
      console.log("svgLayer: ", newLayer);
    });
    const svgRef = this.svgLayer;
    const page = this;
    this.touchListener = TouchHandler(DrawCallback(svgRef),
      {
        element: global.window,
        step: 10,
        round: false,
        listener: MovementListener,
        noscroll: true
      }
    );*/
  }

  readHash() {
    if(global.window) {
      const hash = /#/.test(window.location.href) ? window.location.href.replace(/.*#/, "") : "1";
      const subpage = parseInt(hash);
      return subpage;
    }
    return 1;
  }

  getHash() {
    const { rootStore, router } = this.props;
    if(global.window) {
      const subpage = this.readHash();
      if(!isNaN(subpage)) {
        if(subpage != rootStore.state.subpage) {
          rootStore.setState({ subpage });
          this.forceUpdate();
        }
      }
    } else {
      console.log("query: ", router.query);
    }
  }
  /**
   * { function_description }
   */
  componentDidMount() {
    const { rootStore, router } = this.props;
    console.log("Home.componentDidMount ");
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

  componentDidUpdate(prevProps) {
    const { pathname, query } = this.props.router;
    /*  if(query !== prevProps.router.query) {
      this.getHash();
    }*/
  }

  handleNext = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage + 1 });
    if(global.window) window.location.hash = `#${subpage + 1}`;
    //this.forceUpdate();
  };

  handlePrev = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage - 1 });
    if(global.window) window.location.hash = `#${subpage - 1}`;
    //this.forceUpdate();
  };

  render() {
    const { rootStore, router } = this.props;
    let swipeEvents = {};
    var e = null;
    if(global.window !== undefined) window.page = this;

    const t = ` perspective(100vw) scaleX(${rootStore.state.mirrored ? -1 : 1})`; // `rotateZ(${rootStore.state.angle}deg) ` + (rootStore.state.mirrored ? " rotateY(-180deg) " : "");
    const endDate = new Date("01.01.2035");
    const now = new Date();

    const seconds = (endDate.getTime() - now.getTime()) / 1000;

    //const timespan = tims.text(, {    lang: "fr"   }); /*.split(/,/g).slice(0, 2).join(', ')*/
    const timespan = Util.timeSpan(Math.floor(seconds));

    const subpage = this.readHash(); //rootStore.state.subpage;
    //console.log("Home.render", { subpage });
    return (
      <div className={"main-layout"}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div
          className={"subpage flex-vertical"}
          style={{ opacity: subpage == 1 ? 1 : 0, display: subpage == 1 ? "flex" : "flex" }}
        >
          <div style={{ transformStyle: "preserve-3d", transform: t }}>
            <img src={"/static/img/logo-transparent.png"} style={{ width: "100%", maxWidth: "1280px" }} />
          </div>
          {/*  <img src={"/static/img/arrow-next.svg"} style={{ transform: 'scaleX(-1)' }} />*/}
        </div>
        <div className={"subpage"} style={{ opacity: subpage == 2 ? 1 : 0, display: subpage == 2 ? "block" : "block" }}>
          <h1>Title</h1>
          <span className={"paragraph"}>
            The earliest known appearance of the phrase is from The Boston Journal. In an article titled "Current Notes"
            in the February 9, 1885, edition, the phrase is mentioned as a good practice sentence for writing students:
            "A favorite copy set by writing teachers for their pupils is the following, because it contains every letter
            of the alphabet: 'A quick brown fox jumps over the lazy dog.'" Dozens of other newspapers published the
            phrase over the next few months, all using the version of the sentence starting with "A" rather than "The".
            The earliest known use of the phrase in its modern form (starting with "The") is from the 1888 book
            Illustrative Shorthand by Linda Bronson. The modern form (starting with "The") became more common despite
            the fact that it is slightly longer than the original (starting with "A"). As the use of typewriters grew in
            the late 19th century, the phrase began appearing in typing lesson books as a practice sentence. Early
            examples include How to Become Expert in Typewriting: A Complete Instructor Designed Especially for the
            Remington Typewriter (1890), and Typewriting Instructor and Stenographer's Hand-book (1892). By the turn of
            the 20th century, the phrase had become widely known. In the January 10, 1903, issue of Pitman's Phonetic
            Journal, it is referred to as "the well known memorized typing line embracing all the letters of the
            alphabet".{" "}
            {/*Robert Baden-Powell's book Scouting for Boys (1908) uses the phrase as a practice sentence for signaling. The
            first message sent on the Moscow–Washington hotline on August 30, 1963, was the test phrase "THE QUICK BROWN FOX JUMPED OVER THE LAZY DOG'S BACK 1234567890". Later, during testing, the
            Russian translators sent a message asking their American counterparts, "What does it mean when your people say 'The quick brown fox jumped over the lazy dog'?" During the 20th century,
            technicians tested typewriters and teleprinters by typing the sentence.*/}
          </span>
        </div>
        <div
          className={"subpage flex-vertical"}
          style={{ opacity: subpage == 3 ? 1 : 0, display: subpage == 3 ? "flex" : "flex" }}
        >
          <div className={"time-counter"}>{timespan}</div>
        </div>
        {subpage > 1 ? (
          <a className={"button-prev"} href={"#" + (subpage - 1)} onClick={this.handlePrev}>
            <img src={"/static/img/arrow-next.svg"} style={{ transform: "scaleX(-1)" }} />
          </a>
        ) : (
          undefined
        )}
        <a
          className={"button-next"}
          href={subpage < 3 ? "#" + (subpage + 1) : "/browse"}
          onClick={subpage >= 3 ? undefined : this.handleNext}
        >
          <img src={"/static/img/arrow-next.svg"} />
        </a>
        <SvgOverlay svgRef={this.svgLayer} />

        <style jsx global>{`
          h1 {
            text-align: left;
          }
          span.paragraph {
            font-size: 2em;
          }
          .article-list {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .button-next {
            position: fixed;
            right: 10px;
            bottom: 10px;
          }
          .button-prev {
            position: fixed;
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
          .flex-vertical {
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .subpage {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            font-size: 2vw;

            transition: opacity 0.5s;
            padding: 0 10px 0 10px;
            overflow: auto;
          }

          .main-layout {
            display: block;
            padding: 0;
            margin: 0;
            overflow: ĥidden;
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
        `}</style>
      </div>
    );
  }
}

export default Home;

