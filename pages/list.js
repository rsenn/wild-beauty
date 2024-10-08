import React from "react";
import { Element, Point, Rect, Matrix } from "../lib/dom.js";
import { getAPI } from "../stores/api.js";
import Util from "../lib/util.js";
import { SvgOverlay } from "../lib/svg/overlay.js";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { ItemView } from "../components/views/itemView.js";
//import { Graph } from "../components/graph.js";
import { toJS } from "mobx";
import { getOrCreateStore } from "../stores/createStore.js";
//import { fromTriangles } from "transformation-matrix";
import { trkl } from "../lib/trkl.js";
import Layout from "../components/layout.js";
import { findInTree } from "../stores/functions.js";
import { withSize } from "react-sizeme";

@inject("rootStore")
@observer
class List extends React.Component {
  state = {
    zIndex: 99999,
    tree: {},
    parentIds: [],
    view: "list"
  };
  static fields = [
    "id",
    "type",
    "parent_id",
    "parent { id type data }",
    "children { id type data }",
    "data",
    "photos { photo { id width height filesize colors original_name } }",
    "users { user { id username last_seen } }"
  ];

  svgRef = trkl();

  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;
    const categoryId = query.category || 4;
    let api = rootStore.api;
    List.api = api;
    let result,
      items = [];
    result = await List.api(
      `query MyQuery { items(where: {id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id width height } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    result = await List.api(
      `query MyQuery { items(where: {parent_id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id width height } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    let depth, children;
    const pageProps = { items, categoryId, depth, children };
    console.log("List.getInitialProps", { depth, pageProps });
    return pageProps;
  }

  constructor(props) {
    super(props);
    const { rootStore } = this.props;
    this.api = getAPI(
      global.window && /192\.168/.test(window.location.href)
        ? "http://127.0.0.1:8080/v1/graphql"
        : "/v1/graphql"
    );
    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      window.stores = getOrCreateStore();
    }
    rootStore.items.clear();
    this.tree = rootStore.getHierarchy();
    if(this.props.params && this.props.params.id !== undefined) {
      this.state.view = "item";
      this.state.itemId = parseInt(this.props.params.id);
    } else if(this.tree) {
      var item = findInTree(this.tree, "Objects");
      item.checked = true;
      Util.traverseTree(item, i => this.state.parentIds.push(i.id));
    }
  }

  componentDidMount() {
    const { rootStore, router } = this.props;

    try {
      rootStore.loadItems().then(response => {
        if(response) {
          //console.log("Items: ", response.items);
          this.tree = rootStore.getHierarchy(undefined, it => {
            if(!it.children) it.size = 20;
            it.value = it.id;
            return it;
          });
          //console.log("this.tree", toJS(this.tree));
        }
      });
    } catch(e) {}
  }

  handleClick = event => {
    const { nativeEvent } = event;
    //console.log("handleClick", event.buttons, nativeEvent.buttons, nativeEvent);
    let e = event.currentTarget;
    if(this.element === e) {
      this.grid.style.transition = `transform ${this.speed}s ease-in-out`;
      this.grid.style.transform = "";
      this.element = null;
      if(this.back) {
        this.back.parentElement.removeChild(this.back);
        this.back = null;
      }
      return;
    }
    Element.findAll(".tile").forEach(e => {
      if(e !== event.currentTarget)
        Element.setCSS(e, { transition: "transform 0.2s ease-in", transform: "", zIndex: 8 });
      e.style.setProperty("transform", "none");
    });
    while(e.parentElement && !e.classList.contains("tile")) {
      e = e.parentElement;
    }
    let grid = Element.find("#item-grid");
    let b = Element.find(".page-layout");
    let brect = Element.rect("body");
    let rect = Element.rect(e);
    let points = rect.toPoints().map(p => [p.x, p.y]);
    let rect2 = Element.rect("#item-grid");
    let lrect = Element.rect(".show-layout2");
    let points2 = rect2.toPoints().map(p => [p.x, p.y]);
    //    var matrix = fromTriangles(points.slice(0, 3), points2.slice(0, 3));
    //    //console.log("matrix fromTriangles: ", matrix);
    var srect = new Rect({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    var size = Math.min(rect2.width, window.innerHeight - 20, window.innerWidth - 20);
    var pt = new Point(srect.center);
    pt.y += window.scrollY;
    var t = Point.diff(pt, rect.center);
    var origin = Point.diff(rect.center, rect2);
    var distance = Math.sqrt(t.x * t.x + t.y * t.y);
    this.speed = distance * 0.002;
    var gm = Matrix.init_translate(t.x, t.y);
    //console.log("translation:  ", t);
    var scale = [(size / rect.width) * 1, (size / rect.height) * 1];
    var m = Matrix.init_identity();
    m = Matrix.translate(m, -rect.center.x, -rect.center.y);
    m = Matrix.translate(m, rect2.center.x, rect2.center.x);
    m = Matrix.translate(m, 0, window.scrollY + rect2.y / 2);
    m.xx *= scale[0];
    m.yy *= scale[1];
    var dm = new DOMMatrix();
    dm.translateSelf(t.x, t.y);
    dm.scaleSelf(scale[0], scale[1]);
    var dms = dm.toString();
    //console.log("b: ", b);
    this.element = e;
    this.grid = grid;
    e = this.grid;
    Element.setCSS(this.grid, {
      transformOrigin: `${origin.x}px ${origin.y}px`,
      transform: "",
      transition: `transform 0.5s linear`
    });

    var tend = e => {
      //console.log("transition end: ", e.target);
      //console.log("transformOrigin: ", e.target.style.transformOrigin);
      //console.log("dm: ", dm);
      Element.setCSS(e.target, { transition: `transform 0.5s ease-out`, transform: dm.toString() });
      e.target.removeEventListener("transitionend", tend);
    };
    e.addEventListener("transitionend", tend);
    //console.log("rect: ", rect);

    Element.setCSS(e, {
      transition: `transform ${this.speed} ease-out`,
      transform: dms,
      zIndex: 9
    });
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
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
    };
    if(global.window) {
      window.addEventListener("resize", event => {
        const { currentTarget, target } = event;
      });
    }
    let tree = this.tree;
    const items = this.props.items
      ? this.props.items.filter(item => this.state.parentIds.indexOf(item.parent_id) != -1)
      : [];
    console.log("List.render ");
    return (
      <Layout>
        <br />
        {/*  <Graph data={getTreeData()} />*/}
        <br />
        <br />
        {this.state.view == "item" ? (
          <ItemView id={this.state.itemId} />
        ) : (
          <div className={"show-layout2"}>
            <div id={"item-grid"} style={{ margin: "0 0" }}>
              <div className={"grid-col grid-gap-20"}>
                {items.map(item => {
                  //console.log("item: ", item);
                  const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                  const haveImage = photo_id >= 0;
                  let photo = haveImage ? item.photos[0].photo : null;
                  const path = haveImage ? `/api/photo/get/${photo_id}` : "static/img/no-image.svg";
                  const opacity = photo_id >= 0 ? 1 : 0.3;
                  if(photo !== null) photo.landscape = photo.width > photo.height;
                  let { data, name, parent, type, children, users } = item;
                  try {
                    data = item.data && item.data.length && JSON.parse(item.data);
                  } catch(err) {
                    data = item.data;
                  }
                  if(typeof data != "object" || data === null) data = {};
                  return (
                    <div className={"tile"} id={`item-${item.id}`} onClick={this.handleClick}>
                      <SizedAspectRatioBox
                        style={{
                          position: "relative",
                          boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.75)",
                          overflow: "hidden"
                        }}
                        className={"layer gallery-aspect-box"}
                      >
                        {haveImage ? (
                          <img
                            src={path}
                            width={photo.width}
                            height={photo.height}
                            style={{
                              width: photo.landscape ? (photo.width * 100) / photo.height + "%" : "100%",
                              height: "auto",
                              opacity
                            }}
                            className='gallery-image'
                          />
                        ) : undefined}
                        <div
                          style={{
                            position: "absolute",
                            padding: "2px",
                            background: haveImage
                              ? "none"
                              : "linear-gradient(0deg, hsla(51, 91%, 80%, 0.5) 0%, hsla(51, 95%, 90%, 0.2) 100%)",
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
                              Children[{children.length}]: {children.map(ch => ch.id).join(",")}
                              <br />
                            </span>
                          ) : undefined}
                          Parent: {parent ? parent.id : -1} <br />
                          {!!type ? `Type: ${type}` : undefined}
                          {!!name ? `Name: ${name}` : undefined}
                          <br />
                          <br />
                          <pre
                            style={{
                              fontFamily: "Fixedsys,Monospace,'Ubuntu Mono','Courier New',Fixed",
                              fontSize: "16px"
                            }}
                          >
                            {[...Object.entries(data)]
                              .map(([key, value]) => (key == "title" ? value : `${Util.ucfirst(key)}: ${value}`))
                              .join("\n")}
                          </pre>
                        </div>
                      </SizedAspectRatioBox>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <SvgOverlay svgRef={this.svgRef}>
          <use href='#tree' />
        </SvgOverlay>
        <style jsx global>{`
          .show-layout {
            padding: 0px 20px;
            box-sizing: border-box;
            overflow: visible;
            min-height: 60vh;
          }
          .show-layout2 {
            padding: 0px 20px;
            width: 100vw;
            text-align: left;
          }
          #item-grid {
            padding: 20px 0;
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
          .dropdown-content {
            z-index: 12;
          }
          button.tag-remove {
            transform: translateY(-3px);
            min-height: 21.5px;
            min-width: 21.5px;
            padding: 2px;
            margin: 0 3px;
            border-width: 1px;
            color: red;
          }
          span.tag,
          span.node-label {
            font-size: 15px;
          }
        `}</style>
      </Layout>
    );
  }
}

function getTreeData() {
  return {
    name: "[1]",
    children: [
      { name: "[41]", size: 30 },
      { name: "org", size: 30 },
      { name: "[57]", size: 30 },
      { name: "[58]", size: 30 },
      { name: "[59]", size: 30 },
      { name: "[60]", size: 30 },
      { name: "[61]", size: 30 },
      { name: "[62]", size: 30 },
      {
        name: "objects",
        children: [
          {
            name: "electronics",
            children: [
              { name: "[119]", size: 30 },
              { name: "[120]", size: 30 },
              { name: "[121]", size: 30 },
              { name: "[122]", size: 30 },
              { name: "[123]", size: 30 },
              { name: "[124]", size: 30 },
              {
                name: "pic",
                children: [
                  { name: "lc-meter", size: 30 },
                  { name: "rgb-led", size: 30 },
                  { name: "picstick-25k50", size: 30 }
                ]
              },
              { name: "Audio", size: 30 },
              { name: "RS232", children: [{ name: "jdm2-programmer", size: 30 }] }
            ]
          },
          {
            name: "boxes",
            children: [
              { name: "[99]", size: 30 },
              { name: "[103]", size: 30 },
              { name: "[98]", size: 30 },
              { name: "[86]", size: 30 },
              { name: "Test", size: 30 }
            ]
          },
          { name: "bags", children: [{ name: "[64]", size: 30 }] }
        ]
      },
      {
        name: "subjects",
        children: [
          {
            name: "[89]",
            children: [
              { name: "[105]", size: 30 },
              { name: "Roman", size: 30 }
            ]
          },
          { name: "groups", size: 30 }
        ]
      }
    ]
  };
}

export default withSize()(List);
