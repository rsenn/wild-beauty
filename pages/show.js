import React from "react";
import Head from "next/head";
import Layer from "../components/layer.js";
import { Element, Node, HSLA } from "../utils/dom.js";
import getAPI from "../utils/api.js";
import Util from "../utils/util.js";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { inject, observer } from "mobx-react";
import ApolloClient from "apollo-boost";
import { TouchCallback } from "../components/TouchCallback.js";
import LoginForm from "../components/login.js";
import { WrapInAspectBox, SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { action, toJS, autorun } from "mobx";
import Nav from "../components/nav.js";
import { createStore, getOrCreateStore } from "../stores/createStore.js";

import "../static/css/grid.css";

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

@inject("rootStore")
@observer
class Show extends React.Component {
  static async getInitialProps(ctx) {
    console.log("Show.getInitialProps ");
    const { RootStore } = ctx.mobxStore;
    console.log("RootStore.fetchItems");
    let items = await getAPI().list("items", [
      "id",
      "type",
      "parent { id type data }",
      "children { id type data }",
      "data",
      "photos { photo { id width height filesize original_name } }",
      "users { user { id username last_seen } }"
    ]);
    //await RootStore.fetchItems();
    console.log("Show.getInitialProps  items:", items);
    items.forEach(item => RootStore.newItem(item));
    return { items };
  }

  constructor(props) {
    super(props);

    this.api = getAPI(global.window && /192\.168/.test(window.location.href) ? "http://wild-beauty.herokuapp.com/v1/graphql" : "/v1/graphql");

    const { rootStore } = this.props;

    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      window.stores = getOrCreateStore();
    }

    //    autorun(() => console.log("loading: ", rootStore.state.loading));
    /*  autorun(() => {
      console.log("re: ", rootStore.state.loading);
      this.forceUpdate();
    });*/
  }

  componentDidMount() {
    /*    this.api.list("items", "type data photos { photo { width height data filesize } } users { user { id username last_seen } }").then(res => {
      console.log("items: ", res);
    });*/
  }

  render() {
    const { rootStore } = this.props;

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

    if(global.window) {
      /*Element.findAll('*').forEach(e => {

  e.addEventListener('resize', event => {
    console.log("Resized: ", event.target);
  })
});
*/
      window.addEventListener("resize", event => {
        const { currentTarget, target } = event;
        console.log("Resized: ", { currentTarget, target });
      });
    }
    console.log("Show.render");

    return (
      <div className={"main-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav loading={rootStore.state.loading} />
        <div className={"page-layout"}>
          {/*       <div
            className={"panels"}
            style={{
              position: "relative",
              top: "0",
              overflow: "hidden",
              display: "inline-flex",
              flexFlow: "row wrap",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              padding: "0 0 0 0",
              margin: "0 auto 0 auto"
            }}
          >*/}
          <div
            style={{
              marginLeft: "-8px",
              padding: "4px",
              width: "90vw"
            }}
          >
            <div className={"grid-4col grid-gap-1em"}>
              {this.props.items.map(item => {
                console.log("item: ", item);
                const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                const haveImage = photo_id >= 0;
                const path = haveImage ? `/api/image/get/${photo_id}` : "static/img/no-image.svg";
                const opacity = photo_id >= 0 ? 1 : 0.3;
                console.log("item: ", item);
                let { data, parent, type, children, users } = item;

                data = item.data && item.data.length && JSON.parse(item.data);
                if(typeof data != "object" || data === null) data = {};
                console.log("data: ", data);

                return (
                  <div className={'tile'} id={`item-${item.id}`}>
                    <SizedAspectRatioBox
                      style={{
                        position: "relative",
                        border: "1px solid black",
                        boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.75)",

                        overflow: "hidden"
                      }}
                      className={"layer gallery-aspect-box"}
                    >
                      {haveImage ? <img src={path} style={{ maxWidth: "28vw", width: "100%", height: "auto", opacity }} className="gallery-image" /> : undefined}

                      <div
                        style={{
                          position: "absolute",
                          padding: "2px",
                          background: "linear-gradient(0deg, hsla(51, 91%, 80%, 0.5) 0%, hsla(51, 95%, 90%, 0.2) 100%)",
                          textAlign: "left",
                          top: "0px",
                          left: "0px",
                          fontSize: "15px"
                        }}
                      >
                        Id: {item.id}
                        <br />
                        Number of children: {children.length}
                        <br />
                        Parent Id: {parent ? parent.id : -1} <br />
                        {!!type ? `Type: ${type}` : undefined}
                        <br />
                        <br />
                        <pre style={{ fontFamily: "Fixedsys,Monospace,'Ubuntu Mono','Courier New',Fixed", fontSize: "16px" }}>
                          {[...Object.entries(data)].map(([key, value]) => `${Util.ucfirst(key)}: ${value}`).join("\n")}
                        </pre>
                      </div>
                    </SizedAspectRatioBox>
                  </div>
                );
              })}
            </div>
            {/*          <Layer w={300} h={"300px"} margin={10} padding={2} border={"2px dashed red"}>
            Layer
          </Layer>*/}
            <SvgOverlay />
          </div>
          <style jsx global>{`
            .main-layout {
              width: 100vw;
              overflow: auto;
            }
            .gallery-image {
              height: auto;
            }
            .panels {
              margin: 40pxf auto 0 auto;
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
              position: relative;
              top: 0px;
              width: 100vw;
              text-align: center;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              z-index: 1;
            }
            .tile {
              transition: transform 1s ease-in-out;
            }
            .tile:hover {
              transform: scale3d(2, 2, 2);
            }
          `}</style>
        </div>
      </div>
    );
  }
}

export default Show;
