import React from "react";
import Head from "next/head";
import Layer from "../components/layer.js";
import { Element, Node, HSLA, PointList, Point, Rect, Matrix } from "../utils/dom.js";
import getAPI from "../utils/api.js";
import Util from "../utils/util.js";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { inject, observer } from "mobx-react";
import ApolloClient from "apollo-boost";
import { TouchCallback } from "../components/TouchCallback.js";
import LoginForm from "../components/login.js";
import { WrapInAspectBox, SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { action, toJS, autorun, observable } from "mobx";
import Nav from "../components/nav.js";
import { createStore, getOrCreateStore } from "../stores/createStore.js";
import affineFit from "affinefit";
import { fromTriangles, applyToPoint } from "transformation-matrix";

import "../static/css/grid.css";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../static/css/react-dropdown-tree-select.css";

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

const findInTree = (tree, value) => {
  if(tree.value === value) return tree;
  if(tree.children) {
    for(let child of tree.children) {
      let ret = findInTree(child, value);
      if(ret !== null) return ret;
    }
  }
  return null;
};

const makeItemToOption = selected => item => {
  let data = item && typeof item.data == "string" && item.data.length > 0 ? JSON.parse(item.data) : item && item.data != null && typeof item.data == "object" ? item.data : {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label, title: label, id: value, parent_id: item.parent_id, value, expanded: true, checked: selected === value };
  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  return obj;
};

@inject("rootStore")
@observer
class Show extends React.Component {
  state = {
    zIndex: 99999,
    tree: {},
    parentIds: []
  };

  static async getInitialProps(ctx) {
    //console.log("Show.getInitialProps ");
    const { RootStore } = ctx.mobxStore;
    //console.log("RootStore.fetchItems");
    let items = await getAPI().list("items", [
      "id",
      "type",
      "parent_id",
      "parent { id type data }",
      "children { id type data }",
      "data",
      "photos { photo { id width height filesize original_name } }",
      "users { user { id username last_seen } }"
    ]);
    //await RootStore.fetchItems();
    console.log("Show.getInitialProps  items:", items);
    items = items.sort((a, b) => a.id - b.id);
    RootStore.items.clear();
    //  items.forEach(item => RootStore.newItem(item));
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
    //console.log("props.items: ", props.items);
    rootStore.items.clear();
    props.items.forEach(item => {
      rootStore.newItem(item);
      //      rootStore.items.set(parseInt(item.id), item);
    });
    //console.log("rootItemId: ", rootStore.rootItemId);
    this.tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());
    console.log("this.tree: ", this.tree);
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
  }

  @action.bound
  treeSelEvent(type, arg) {
    const { rootStore } = this.props;
    switch (type) {
      case "change": {
        console.log("treeSelEvent: ", arg.value);
        Util.traverseTree(this.tree, item => {
          item.checked = false;
        });
        const item = findInTree(this.tree, arg.value);
        if(item) {
          item.checked = true;
          this.state.node = item.value;
          //  this.tree = rootStore.getItem(this.state.node, makeItemToOption());
          var children = Util.flatTree(item);
          var ids = children.map(child => child.id);
          console.log("treeSelEvent: ", ids, item.title);
          this.setState({ parentIds: ids });
        }
        //rootStore.setState({ selected: arg.value });
        break;
      }
      default: {
        //console.log("treeSelEvent: ", type, arg);
        break;
      }
    }
  }

  handleClick = event => {
    let e = event.currentTarget;

    Element.findAll(".tile").forEach(e => {
      e.style.setProperty("transition", "transform 0.3s linear");
      e.style.setProperty("transform", "none");
    });

    while(e.parentElement && !e.classList.contains("tile")) {
      e = e.parentElement;
    }
    let rect = Element.rect(e);
    let points = rect.toPoints().map(p => [p.x, p.y]);
    let rect2 = Element.rect("#item-grid");
    let points2 = rect2.toPoints().map(p => [p.x, p.y]);
    //console.log("handleClick:\nrect: ", rect.toString(), "\npoints: ", PointList.toString(points), "\nrect2: ", rect2.toString(), "\npoints2: ", PointList.toString(points2));
    var trn = affineFit(points, points2);
    //console.log("trn: ", trn.M);
    var matrix = fromTriangles(points.slice(0, 3), points2.slice(0, 3));

    var scale = [(rect2.width / rect.width) * 1, (rect2.width / rect.height) * 1];
    var m = Matrix.init_identity();

    m = Matrix.translate(m, -rect.center.x, -rect.center.y);
    m = Matrix.translate(m, rect2.center.x, rect2.center.x);
    m = Matrix.translate(m, 0, window.scrollY);

    m.xx *= scale[0];
    m.yy *= scale[1];

    //m = Matrix.scale.apply(Matrix, scale);

    var dm = Matrix.toDOMMatrix(m);
    //console.log("matrix: ", m);

    var dms = dm.toString();

    //console.log("event.target: ", e);
    e.style.setProperty("transition", "transform 1s ease-out");

    e.style.setProperty("transform", dms);
    e.style.setProperty("background-color", "white");
    e.style.setProperty("z-index", this.state.zIndex++);

    if(global.window) {
      window.t = e;
      window.m = m;
    }
  };

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
          //console.log("multitouch", event);
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );
    }
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      //console.log("onChange: ", value);
    };
    const list = [
      "static/img/86463ed8ed391bf6b0a2907df74adb37.jpg",
      "static/img/8cb3c5366cc81b5fe3e061a65fbf4045.jpg",
      "static/img/cdb466a69cc7944809b20e7f34840486.jpg",
      "static/img/e758ee9aafbc843a1189ff546c56e5b5.jpg",
      "static/img/fdcce856cf66f33789dc3934418113a2.jpg"
    ];
    if(global.window) {
      window.addEventListener("resize", event => {
        const { currentTarget, target } = event;
        //console.log("Resized: ", { currentTarget, target });
      });
    }
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);
    let tree = this.tree;
    const items = this.props.items.filter(item => this.state.parentIds.indexOf(item.parent_id) != -1);
    console.log("Show.render", { tree, items });
    return (
      <div className={"page-layout"} {...TouchEvents(touchListener)}>
        <Head>
          <title>Show</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav loading={rootStore.state.loading} />
        <div className={"show-layout"}>
          {tree ? (
            <DropdownTreeSelect
              data={tree}
              onChange={obj => {
                //console.log("Tree value: ", obj);
                rootStore.state.parent_id = obj.value;
                makeTreeSelEvent("change")(obj);
              }}
              onNodeToggle={makeTreeSelEvent("node-toggle")}
              onFocus={makeTreeSelEvent("focus")}
              onBlur={makeTreeSelEvent("blur")}
              className={"dropdown-tree"}
              mode={"radioSelect"}
              texts={{ placeholder: "parent item" }}
            />
          ) : (
            undefined
          )}
          {/*          <img src={"static/img/test.svg"} />
           */}{" "}
          <div id={"item-grid"} style={{ margin: "0 0" }}>
            <div className={"grid-col grid-gap-20"}>
              {items.map(item => {
                // console.log("item: ", item);
                const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                const haveImage = photo_id >= 0;
                const path = haveImage ? `/api/image/get/${photo_id}` : "static/img/no-image.svg";
                const opacity = photo_id >= 0 ? 1 : 0.3;
                //    console.log("item: ", item);
                let { data, parent, type, children, users } = item;

                try {
                  data = item.data && item.data.length && JSON.parse(item.data);
                } catch(err) {
                  data = item.data;
                }
                if(typeof data != "object" || data === null) data = {};
                //        console.log("data: ", data);

                return (
                  <div className={"tile"} id={`item-${item.id}`} onClick={this.handleClick}>
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
                          background: haveImage ? "none" : "linear-gradient(0deg, hsla(51, 91%, 80%, 0.5) 0%, hsla(51, 95%, 90%, 0.2) 100%)",
                          textAlign: "left",
                          top: "0px",
                          left: "0px",
                          fontSize: "15px"
                        }}
                      >
                        Id: {item.id}
                        <br />
                        {children.length > 0 ? (
                          <span>
                            Children ({children.length}): {children.map(ch => ch.id).join(", ")}
                            <br />
                          </span>
                        ) : (
                          undefined
                        )}
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
          </div>
        </div>
        <SvgOverlay />
        <style jsx global>{`
          .show-layout {
            text-align: left;
            width: 100vw;
            padding: 0px 20px;
            box-sizing: border-box;
            overflow: auto;
            min-height: 60vh;
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

          .tile {
            transition: transform 1s ease-in-out;
          }
        `}</style>
      </div>
    );
  }
}

export default Show;
