import React from "react";
import Head from "next/head";
import Link from "next/link";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../utils/alea.js";
import { Timer, Element } from "../utils/dom.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import Util from "../utils/util.js";
import { inject, observer } from "mobx-react";
import { trkl } from "../utils/trkl.js";
import axios from "../utils/axios.js";
import { ColorScheme } from "../utils/colorscheme.js";
import { withSize, SizeMe } from "react-sizeme";

import "../static/style.css";

const rng = Alea.singleton(Date.now());
const imagePaths = lazyInitializer(() => randomImagePaths());

@inject("rootStore")
@observer
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
      //console.log("query: ", router.query);
    }
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    //console.log("Home.componentDidMount ");
    this.getHash();
    var counter = 0;
    /*  Timer.interval(1000, () => {
      counter++;
      if(counter % 3 == 0) {
        rootStore.setState({
          mirrored: !rootStore.state.mirrored
        });
      }
      this.forceUpdate();
    });*/
  }

  componentDidUpdate(prevProps) {
    const { pathname, query } = this.props.router;
  }

  handleNext = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage + 1 });
    if(global.window) window.location.hash = `#${subpage + 1}`;
  };

  handlePrev = () => {
    const { rootStore } = this.props;
    const subpage = rootStore.state.subpage;
    rootStore.setState({ subpage: subpage - 1 });
    if(global.window) window.location.hash = `#${subpage - 1}`;
  };

  animateLogo = () => {
    //console.log("Home.animateLo$go", this.anim);
    if(!this.anim) {
      this.anim = {
        initialized: false,
        interval: 2000,
        tLogo: null,
        angle: 0,
        step: 0,
        angles: { x: 0, y: 0, z: 0 },
        vector: {
          x: 0,
          y: 0,
          z: 0,
          get magnitude() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
          },
          clear() {
            this.x = 0;
            this.y = 0;
            this.z = 0;
          },
          normalize() {
            const mag = this.magnitude;
            this.x /= mag;
            this.y /= mag;
            this.z /= mag;
          }
        },
        init() {
          if(!this.initialized) {
            const e = Element.find("#t-logo");
            if(e) {
              this.tLogo = e;
              this.initialized = Date.now();
              console.log(" anim initialized");
              this.tick(0);
            }
          }
        },
        get time() {
          return Date.now() - this.initialized;
        },
        get delta() {
          let prev = this.prev || this.initialized;
          let now = Date.now();
          let delta = now - prev;
          this.prev = now;
          return `+${delta}ms`;
        },
        makeRandAngles(scale = 180) {
          this.setAngles(Math.floor((Math.random() * 2 - 1) * scale), Math.floor((Math.random() * 2 - 1) * scale), Math.floor((Math.random() * 2 - 1) * scale));
          this.angle = Math.floor((Math.random() * 2 - 1) * scale);
        },
        makeRandDirection() {
          this.vector.x = Math.random() * 2 - 1;
          this.vector.y = Math.random() * 2 - 1;
          this.vector.z = Math.random() * 2 - 1;
          this.vector.normalize();
        },
        setAngles(x, y, z) {
          this.angles.x = x;
          this.angles.y = y;
          this.angles.z = z;

          // console.log("setAngles: ", { x, y, z });
        },
        updateAngles() {
          let oldT = this.tLogo.style.transition;
          this.tLogo.style.transition = "";
          Element.setCSS(this.tLogo, {
            //  transform: `perspective(300px) translateZ(-150px) rotateX(${this.angles.x}deg)  rotateY(${this.angles.y}deg) rotateZ(${this.angles.z}deg) `
            transform: `perspective(300px) translateZ(-150px) scale(-1,1) rotate3d(${this.vector.x.toFixed(3)}, ${this.vector.y.toFixed(3)}, ${this.vector.z.toFixed(3)}, ${this.angle}deg)`
          });
          this.tLogo.style.transition = oldT;
        },
        transitionAngles(endfn = () => {}) {
          const transform = `perspective(300px) translateZ(-150px) scale(-1,1)  rotate3d(${this.vector.x.toFixed(3)}, ${this.vector.y.toFixed(3)}, ${this.vector.z.toFixed(3)}, ${this.angle}deg) `;
          Element.transition(this.tLogo, { transform }, 1000).then(t => {
            console.log("Transition END ", this.time, transform);
            Timer.promise(1000).then(() => endfn());
          });
          console.log("Transition START", this.time);
        },
        setTransition(enable = true) {
          Element.setCSS(this.tLogo, { transition: enable ? `transform ${this.interva}ms linear` : "" });
        },
        tick(i) {
          console.log(`Anim tick(${i % 3}) ${this.delta}`);
          switch (i % 3) {
            case 0: {
              this.makeRandDirection();
              //this.makeRandAngles(360);
              this.angle = Math.floor((Math.random() * 2 - 1) * 180);
              this.angle += Math.sign(this.angle) * 180;

              this.transitionAngles(() => this.tick(i + 1));
              break;
            }
            case 1: {
              this.angle = Math.sign(this.angle) * 360;
              //              this.setAngles(Math.sign(this.angles.x) * 360, Math.sign(this.angles.y) * 360, Math.sign(this.angles.z) * 360);
              this.transitionAngles(() => this.tick(i + 1));
              break;
            }
            case 2: {
              this.angle = 0;

              //              this.setAngles(0, 0, 0);
              this.updateAngles();
              Timer.promise(1000).then(() => this.tick(i + 1));
              break;
            }
          }
          //  console.log("anim tick ", this.step % 3, this.angles);
        }
      };
    }
    this.anim.init();
  };

  render() {
    const { rootStore, router, size } = this.props;
    let swipeEvents = {};
    var e = null;
    if(global.window !== undefined) window.page = this;
    const t =
      //` perspective(100vw) scaleX(${rootStore.state.mirrored ? -1 : 1})`;
      ` perspective(300px) translateZ(-150px) rotateY(${rootStore.state.mirrored ? 180 : 0}deg) `;
    const endDate = new Date("01.01.2035");
    const now = new Date();
    const seconds = (endDate.getTime() - now.getTime()) / 1000;
    const timespan = Util.timeSpan(Math.floor(seconds));
    const subpage = this.readHash();
    //console.log("Home.render ", { size });
    var angle = 0;
    if(Util.isBrowser()) {
      Timer.once(3000, () => this.animateLogo());
    }

    return (
      <div className={"main-layout"}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={"subpage flex-vertical"} style={{ opacity: /*subpage == 1 ?*/ 1 /*: 0*/, display: /* subpage == 1 ? "flex" :*/ "flex" }}>
          <div
            id="t-logo"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 1s  cubic-bezier(.53,.38,.94,.32)",
              transform: t
            }}
          >
            <img src={"/static/img/logo-transparent.png"} style={{ width: "100%", maxWidth: "1280px" }} />
          </div>
          {}
        </div>
        <div className={"subpage"} style={{ opacity: subpage == 2 ? 1 : 0, display: subpage == 2 ? "block" : "block" }}>
          <div>
            {({ size }) => {
              const fontSize = Math.round(size.width / 60);
              const charWidth = fontSize - 1;
              const maxLineLength = Math.floor(size.width / charWidth);

              const padding = Math.round((size.width - fontSize * 45) / 3 + 80);
              const paragraphWidth = Math.floor(size.width - padding * 2);
              const lineLength = Math.floor((paragraphWidth + 2) / charWidth);

              // console.log("SizeMe: ", size, { fontSize, maxLineLength, paragraphWidth, lineLength, padding });

              return (
                <div
                  style={{
                    fontSize: `${fontSize}px`,
                    padding: `${padding >= 19 ? Math.round((padding - 19) / 2) : 0}px ${padding}px 0 ${padding}px`
                  }}
                >
                  <h1>Title</h1>
                  <span className={"paragraph"}>
                    The earliest known appearance of the phrase is from The Boston Journal. In an article titled "Current Notes" in the February 9, 1885, edition, the phrase is mentioned as a good
                    practice sentence for writing students: "A favorite copy set by writing teachers for their pupils is the following, because it contains every letter of the alphabet: 'A quick brown
                    fox jumps over the lazy dog.'" Dozens of other newspapers published the phrase over the next few months, all using the version of the sentence starting with "A" rather than "The".
                    The earliest known use of the phrase in its modern form (starting with "The") is from the 1888 book Illustrative Shorthand by Linda Bronson. The modern form (starting with "The")
                    became more common despite the fact that it is slightly longer than the original (starting with "A"). As the use of typewriters grew in the late 19th century, the phrase began
                    appearing in typing lesson books as a practice sentence. Early examples include How to Become Expert in Typewriting: A Complete Instructor Designed Especially for the Remington
                    Typewriter (1890), and Typewriting Instructor and Stenographer's Hand-book (1892). By the turn of the 20th century, the phrase had become widely known. In the January 10, 1903,
                    issue of Pitman's Phonetic Journal, it is referred to as "the well known memorized typing line embracing all the letters of the alphabet". {}
                  </span>
                </div>
              );
            }}
          </div>
        </div>
        <div className={"subpage flex-vertical"} style={{ opacity: subpage == 3 ? 1 : 0, display: subpage == 3 ? "flex" : "flex" }}>
          <div className={"time-counter"}>{timespan}</div>
        </div>
        {/*subpage > 1 ? (
          <a className={"button-prev"} href={"#" + (subpage - 1)} onClick={this.handlePrev}>
            <img src={"/static/img/arrow-next.svg"} style={{ transform: "scaleX(-1)" }} />
          </a>
        ) : (
          undefined
        )*/}
        <Link href={"/show"}>
          <a className={"button-next"} onClick={this.handleNext}>
            <img src={"/static/img/arrow-next.svg"} />
          </a>
        </Link>
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
            font-size: 13px;

            transition: opacity 0.5s;
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

export default /* withSize()*/ Home;
