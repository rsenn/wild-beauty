import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import { Element, Node, HSLA } from "../utils/dom.js";
import API from "../utils/api.js";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import Dropzone from "react-dropzone";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { inject, observer } from "mobx-react";
import ApolloClient from "apollo-boost";
import { TouchCallback } from "../components/TouchCallback.js";
import { WrapInAspectBox, SizedAspectRatioBox } from "../components/simple/aspectBox.js";

/*
const client = new ApolloClient({
  uri: "http://wild-beauty.herokuapp.com/v1/graphql"
});
*/
const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")]
    .map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined))
    .filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

class Show extends React.Component {
  constructor(props) {
    super(props);

    this.api = API(
      global.window && /192\.168/.test(window.location.href)
        ? "http://wild-beauty.herokuapp.com/v1/graphql"
        : "/v1/graphql"
    );

    if(global.window) {
      window.api = this.api;
      window.page = this;
    }
  }

  componentDidMount() {
    this.api
      .list(
        "items",
        "type data photos { photo { width height data filesize } } users { user { id name last_seen } }"
      )
      .then(res => {
        console.log("items: ", res);
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
    const onError = event => {};

    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      console.log("onChange: ", value);
    };
    const list = [
      "static/img/86463ed8ed391bf6b0a2907df74adb37.jpg",
      "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg",
      "static/img/cdb466a69cc7944809b20e7f34840486.jpg",
      "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg",
      "static/img/fdcce856cf66f33789dc3934418113a2.jpg"
    ];
    return (
      <div className={"main-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav />
        <div className={"page-layout"}>
          {/* <form action="upload" method="POST" onSubmit={e => e.preventDefault()}>
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
          <div
            className={"panels"}
            style={{
              position: "absolute",
              top: "250px",
              overflow: "visible",
              display: "flex",
              flexFlow: "row wrap",
              justifyContent: "flex-start",
              alignItems: "stretch",
              position: "absolute",
              maxWidth: "100%",
              maxHeight: "100%"
            }}
          >
            {list.map(path => (
              <SizedAspectRatioBox
                width={"28vw"}
                height={"28vw"}
                style={{
                  margin: "16px",
                  border: "1px dashed black",
                  maxWidth: "20vw",
                  maxHeight: "20vw",
                  overflow: "hidden"
                }}
                className={"gallery-aspect-box"}
              >
                <img
                  src={path}
                  style={{ maxWidth: "28vw", width: "100%", height: "auto" }}
                  className="gallery-image"
                />
              </SizedAspectRatioBox>
            ))}{" "}
          </div>
          <Layer w={300} h={"300px"} margin={10} padding={2} border={"2px dashed red"}>
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

            .page-layout {
              position: absolute;
              top: 250px;
              width: 100vw;
              min-height: 100vh;
              text-align: center;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1;
            }
          `}</style>
        </div>
      </div>
    );
  }
}

export default inject("rootStore")(observer(Show));
