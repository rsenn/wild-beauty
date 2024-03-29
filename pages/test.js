import React, { useState } from "react";
import Layer from "../components/simple/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../lib/scrollController.js";
import Alea from "../lib/alea.js";
import { SwipeTracker } from "../lib/swipeTracker.js";
 import { lazyInitializer } from "../lib/lazyInitializer.js";
import { SvgOverlay } from "../lib/svg/overlay.js";
import { TouchCallback } from "../components/TouchCallback.js";
import Layout from "../components/layout.js";
import { RandomColor } from "../stores/functions.js";
import { MovementListener, MultitouchListener, TurnListener, SelectionListener, SelectionRenderer, TouchEvents, MouseEvents, addTouchListeners, addMouseListeners, TouchListener, TouchHandler } from "../lib/touchHandler.js";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

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
    list = [
      "static/img/86463ed8ed391bf6b0a2907df74adb37.jpg",
      "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg",
      "static/img/cdb466a69cc7944809b20e7f34840486.jpg",
      "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg",
      "static/img/fdcce856cf66f33789dc3934418113a2.jpg"
    ];
  return (
    <Layout>
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
            <img src={path} style={{ maxWidth: "50vmin", width: "100%", height: "auto" }} className='gallery-image' />
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
          overflow: hidden;
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
    </Layout>
  );
};

export default Test;
