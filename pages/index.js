import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Gallery from "../components/gallery.js";
import { Element } from "../lib/dom.js";
import { SvgOverlay } from "../lib/svg-overlay.js";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";
import { CubeSpinner } from "../components/simple/cubeSpinner.js";
import { lazyInitializer } from "../lib/lazyInitializer.js";
import { trkl } from "../lib/trkl.js";

const Home = inject("rootStore")(
  observer(props => {
    const { rootStore } = props;
    var svgLayer = trkl();

    let subpage = 1,
      timespan = Date.now();

    useEffect(() => {
      if(global.window) {
        let l = Element.find("a");
        let href = l.getAttribute("href");

        l.addEventListener("click", e => {
          window.location.replace(href);
        });

        console.log("Browser initialization", l, href);
      }
    });
    return (
      <Layout hideNav={true}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={"subpage flex-vertical"} style={{ opacity: 1, display: "flex" }}>
          <div
            id="t-logo"
            className="t-logo"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 1s  cubic-bezier(.53,.38,.94,.32)",
              transform: ""
            }}
          >
            <img src={"/static/img/logo-transparent.png"} style={{ width: "80vw", maxWidth: "1280px" }} />
          </div>
        </div>
        <div className={"subpage"} style={{ opacity: subpage == 2 ? 1 : 0, pointerEvents: subpage == 2 ? "auto" : "none", display: subpage == 2 ? "block" : "block" }}>
          <div>
            {(size => {
              const fontSize = Math.round(size.width / 60);
              const charWidth = fontSize - 1;
              const maxLineLength = Math.floor(size.width / charWidth);

              const padding = Math.round((size.width - fontSize * 45) / 3 + 80);
              const paragraphWidth = Math.floor(size.width - padding * 2);
              const lineLength = Math.floor((paragraphWidth + 2) / charWidth);

              return (
                <div
                  style={{
                    fontSize: `${fontSize}px`,
                    padding: `${padding >= 19 ? Math.round((padding - 19) / 2) : 0}px ${padding}px 0 ${padding}px`
                  }}
                >
                  <h1>Title</h1>
                  <span className={"paragraph"}>
                    The earliest known appearance of the phrase is from The Boston Journal. In an article titled "Current Notes" in the February 9, 1885, edition, the phrase is mentioned as a good practice sentence for writing students: "A favorite copy set by writing teachers for their pupils is the following, because it contains every letter of the alphabet: 'A quick brown fox jumps over the
                    lazy dog.'" Dozens of other newspapers published the phrase over the next few months, all using the version of the sentence starting with "A" rather than "The". The earliest known use of the phrase in its modern form (starting with "The") is from the 1888 book Illustrative Shorthand by Linda Bronson. The modern form (starting with "The") became more common despite the fact that
                    it is slightly longer than the original (starting with "A"). As the use of typewriters grew in the late 19th century, the phrase began appearing in typing lesson books as a practice sentence. Early examples include How to Become Expert in Typewriting: A Complete Instructor Designed Especially for the Remington Typewriter (1890), and Typewriting Instructor and Stenographer's
                    Hand-book (1892). By the turn of the 20th century, the phrase had become widely known. In the January 10, 1903, issue of Pitman's Phonetic Journal, it is referred to as "the well known memorized typing line embracing all the letters of the alphabet". {}
                  </span>
                </div>
              );
            })({ width: global.window ? window.innerWidth : undefined, height: global.window ? window.innerHeight : undefined })}
          </div>
        </div>
        <div className={"subpage flex-vertical"} style={{ opacity: subpage == 3 ? 1 : 0, pointerEvents: subpage == 3 ? "auto" : "none", display: subpage == 3 ? "flex" : "flex" }}>
          <div className={"time-counter"}>{timespan || ""}</div>
        </div>
        {/*onClick={this.handleNext}*/}
        <div className={"button-next"}>
          <Link href={"/browse"}>
            <a>
              <img className={"fill-parent"} width={64} height={64} src={"/static/img/arrow-next.svg"} style={{ opacity: rootStore.state.loading ? 0 : 1 }} />
            </a>
          </Link>
          <CubeSpinner className={"fill-parent"} width={"3.165em"} height={"3.165em"} loading={rootStore.state.loading} />
        </div>

        {/* <SvgOverlay svgRef={svgLayer} />
         */}
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

          .abs {
            position: absolute;
            left: 0;
            top: 0;
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
          }
          .noscroll {
            overflow: ĥidden;
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
      </Layout>
    );
  })
);

export default Home;
