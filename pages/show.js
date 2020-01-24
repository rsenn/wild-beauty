import React from "react";
import Head from "next/head";
import { Element, Point, Rect, Matrix, Timer } from "../utils/dom.js";
import getAPI from "../stores/api.js";
import Util from "../utils/util.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { ItemView } from "../components/views/itemView.js";
import { Tree } from "../components/tree.js";
import { action } from "mobx";
import Nav from "../components/nav.js";
import { getOrCreateStore } from "../stores/createStore.js";
import affineFit from "affinefit";
import { fromTriangles } from "transformation-matrix";
import { trkl } from "../utils/trkl.js";
import { Graph, Node, Edge } from "../utils/fd-graph.js";
import { makeItemToOption, findInTree } from "../stores/functions.js";

import "../static/css/grid.css";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../static/css/react-dropdown-tree-select.css";

const insertParent = (element, newParent) => {
  const p = element.parentElement;
  p.removeChild(element);
  p.appendChild(newParent);
  newParent.appendChild(element);
};

const removeParent = (element, pred = e => true) => {
  const p = element.parentElement;
  const pp = p.parentElement;

  if(pred(p)) {
    pp.removeChild(p);
    pp.appendChild(element);
  }
};

export function createGraph() {
  let g = new Graph(new Point(300,200), true);

    var node1 = new Node("test", 200);
  var node2 = new Node("test", 200);
  var node3 = new Node("test", 200);
  var node4 = new Node("test", 200);
  var node5 = new Node("test", 200);
  var node6 = new Node("test", 70);
  var node7 = new Node("test", 70);
  var node8 = new Node("test", 70);
  var node9 = new Node("test", 70);
  var node10 = new Node("test", 70);
  var node11 = new Node("test", 70);
  var node12 = new Node("test", 70);
  var node13 = new Node("test", 70);
  var node14 = new Node("test", 90);
  var node15 = new Node("test", 90);
  var node16 = new Node("test", 90);
  var node17 = new Node("test", 90);
  var node18 = new Node("test", 90);
  var node19 = new Node("test", 90);


  var connection1 = new Edge(node1, node2);
  var connection2 = new Edge(node2, node3);
  var connection3 = new Edge(node3, node4);
  var connection4 = new Edge(node4, node5);
  var connection5 = new Edge(node5, node1);
  var connection6 = new Edge(node1, node6);
  var connection7 = new Edge(node2, node7);
  var connection8 = new Edge(node3, node8);
  var connection9 = new Edge(node4, node9);
  var connection10 = new Edge(node5, node10);
  var connection11 = new Edge(node6, node7);
  var connection12 = new Edge(node7, node8);
  var connection13 = new Edge(node8, node9);
  var connection14 = new Edge(node9, node10);
  var connection15 = new Edge(node10, node6);
  var connection16 = new Edge(node11, node12);
  var connection17 = new Edge(node12, node13);
  var connection18 = new Edge(node13, node11);
  var connection19 = new Edge(node14, node15);
  var connection20 = new Edge(node15, node16);
  var connection21 = new Edge(node16, node17);
  var connection22 = new Edge(node17, node18);
  var connection23 = new Edge(node18, node19);

  g.addEdge(connection1);
  g.addEdge(connection2);
  g.addEdge(connection3);
  g.addEdge(connection4);
  g.addEdge(connection5);
  g.addEdge(connection6);
  g.addEdge(connection7);
  g.addEdge(connection8);
  g.addEdge(connection9);
  g.addEdge(connection10);
  g.addEdge(connection11);
  g.addEdge(connection12);
  g.addEdge(connection13);
  g.addEdge(connection14);
  g.addEdge(connection15);

  g.addNode(node1);
  g.addNode(node2);
  g.addNode(node3);
  g.addNode(node4);
  g.addNode(node5);
  g.addNode(node6);
  g.addNode(node7);
  g.addNode(node8);
  g.addNode(node9);
  g.addNode(node10);
  g.addNode(node11);
  g.addNode(node12);
  g.addNode(node13);
  g.addNode(node14);
  g.addNode(node15);
  g.addNode(node16);
  g.addNode(node17);
  g.addNode(node18);
  g.addNode(node19);
}

@inject("rootStore")
@observer
class Show extends React.Component {
  state = {
    zIndex: 99999,
    tree: {},
    parentIds: [],
    view: "list",
    currentItem: null
  };
  static API = getAPI();
  static fields = [
    "id",
    "type",
    "parent_id",
    "parent { id type data }",
    "children { id type data }",
    "data",
    "photos { photo { id width height filesize original_name } }",
    "users { user { id username last_seen } }"
  ];

  svgRef = trkl();

  static async getInitialProps(ctx) {
    const { query, params } = (ctx && ctx.req) || {};
    console.log("Show.getInitialProps ", { query, params });
    const { RootStore } = ctx.mobxStore;
    let items;
    if(params && params.id !== undefined) {
      let id = parseInt(params.id);
      const name = params.id;
      if(isNaN(id) || typeof id != "number") id = -1;
      const q = `query MyQuery { items(where: { _or: [ {id: {_eq: ${id}}}, {name:{_eq:"${name}"}}] }) { id data photos { photo { filesize height width id offset uploaded original_name } } parent_id } }`;
      console.log("query: ", q);
      let response = await Show.API(q);
      items = response.items || [];
      console.log("item: ", items[0]);
    } else {
      items = await Show.API.list("items", Show.fields);
    }
    items = items.sort((a, b) => a.id - b.id);
    RootStore.items.clear();
    return { items, params };
  }

  constructor(props) {
    super(props);
    this.api = getAPI(
      global.window && /192\.168/.test(window.location.href)
        ? "http://wild-beauty.herokuapp.com/v1/graphql"
        : "/v1/graphql"
    );
    const { rootStore } = this.props;
    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      window.stores = getOrCreateStore();
    }
    rootStore.items.clear();
    props.items.forEach(item => {
      rootStore.newItem(item);
    });
    this.tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());
    if(this.props.params.id !== undefined) {
      this.state.view = "item";
      this.state.itemId = parseInt(this.props.params.id);
    } else if(this.tree) {
      var item = findInTree(this.tree, "Objects");
      item.checked = true;
      Util.traverseTree(item, i => this.state.parentIds.push(i.id));
    }
    let a = new Rect(10, 10, 100, 50);
    let b = new Rect(200, 200, 200, 100);
    let bc = b.center;
    console.log("center:", bc.toString());
    let r = new Matrix();
    // r.init_identity();
    r.translate(bc.x, bc.y);
    console.log("translate:", r.toString());
    r.rotate((-15 * Math.PI) / 180);
    r.translate(-bc.x, -bc.y);
    console.log("rotate:", r.toString());
    let dr = null;
    if(global.window) {
      dr = new DOMMatrix();
      dr.translateSelf(bc.x, bc.y);
      console.log("dtranslate:", dr.toString());
      dr.rotateSelf(-15);
      console.log("drotate:", dr.toString());
      dr.translateSelf(-bc.x, -bc.y);
    }
    //  r = Matrix.rotate(-45);
    //    r = Matrix.translate(r, 50,50);
    let m = Matrix.getAffineTransform(a, b);
    let c = new Rect(b);
    let c2 = c.toPoints();
    c = c.toPoints();
    c.transform(r);
    this.b = b;
    this.c = c;
    this.a = a;
    console.log("getAffineTransform", { a, b, m });

    createGraph(new Point(300,200));
  }

  checkTagRemove() {
    if(global.window) {
      let tagRemove = Element.find("button.tag-remove");
      if(tagRemove) {
        tagRemove.addEventListener("click", e => {
          e.preventDefault();
          Timer.once(100, () => {
            console.log("tagRemove: ", tagRemove);
            Util.traverseTree(this.tree, node => {
              node.checked = false;
            });
            this.forceUpdate();
          });
        });
      }
      return tagRemove;
    }
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    this.checkTagRemove();
  }

  componentDidUpdate() {
    this.checkTagRemove();
  }

  touchEvent = event => {
    console.log("Touch event: ", event);
  };

  mouseEvent = event => {
    const { target, nativeEvent } = event;
    const { type, clientX, clientY, pageX: x, pageY: y } = nativeEvent;
    if(!this.rects) {
      this.rects = Element.findAll("rect");
    }
    var r = this.rects.filter(rect => Rect.inside(Element.rect(rect), { x, y }));
    function getNum(elem, name) {
      return parseFloat(elem.getAttribute(name));
    }
    function getId(elem) {
      return parseInt(elem.getAttribute("id").replace(/.*\./, ""));
    }
    if(type.endsWith("move")) {
      var elem = r[0] && r[0].parentElement;
      var hover = -1;
      if(this.prevElem && this.prevElem.style) {
        if(this.prevElem == elem) return;
        this.prevElem.style.removeProperty("transform");
        hover = -1;
      }
      if(elem && elem.style) {
        const t = ` scale(1.4,1.4)`;
        console.log("Mouse event: ", t);
        var parent = elem.parentElement;
        elem.style.setProperty("transition", "transform 1s cubic-bezier(0.19, 1, 0.22, 1)");
        elem.style.setProperty("transform", t);
        this.prevElem = elem;
        hover = getId(elem);
      }
    } else if(type.endsWith("down")) {
      var elem = r[0];
      console.log("Mouse event: ", { type, x, y }, r);
      if(elem) {
        const id = getId(elem.parentElement);
        console.log("Clicked id:", id);
        this.setState({ active: id });
      }
    }
  };

  @action.bound
  selectNode(item) {
    var children = Util.flatTree(item);
    var ids = children.map(child => child.id);
    console.log("treeSelEvent: ", ids, item.title);
    this.setState({ parentIds: ids });
  }

  treeSelEvent(type, arg) {
    const { rootStore } = this.props;
    console.log("treeSelEvent: ", type, arg);
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
          this.selectNode(item);
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  handleTransitionEnd = event => {
    const { nativeEvent, target, currentTarget } = event;
    console.log("handleTransitionEnd", { target, currentTarget, event });
    if(this.element) {
      insertParent(this.element, Element.create("a", { href: `/show/${this.state.currentItem}` }));
    } else if(this.previousElement) {
      removeParent(this.previousElement, e => e.tagName.toLowerCase() == "a");
    }
  };

  handleClick = event => {
    const { nativeEvent, target, currentTarget } = event;
    let e = event.currentTarget;
    let id = Element.attr(currentTarget, "id").replace(/^item-/, "");
    console.log("handleClick", { target, currentTarget, id });
    if(this.element === e) {
      this.grid.style.transition = `transform ${this.speed}s ease-in-out`;
      this.grid.style.transform = "";
      this.previousElement = this.element;
      this.element = null;
      if(this.back) {
        this.back.parentElement.removeChild(this.back);
        this.back = null;
      }
      this.state.currentItem = null;
      return;
    }
    this.state.currentItem = parseInt(id);
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
    var trn = affineFit(points, points2);
    var matrix = fromTriangles(points.slice(0, 3), points2.slice(0, 3));
    console.log("matrix fromTriangles: ", matrix);
    var srect = new Rect({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    var size = Math.min(rect2.width, window.innerHeight - 20, window.innerWidth - 20);
    var pt = new Point(srect.center);
    pt.y += window.scrollY;
    var t = Point.diff(pt, rect.center);
    var origin = Point.diff(rect.center, rect2);
    var distance = Math.sqrt(t.x * t.x + t.y * t.y);
    this.speed = distance * 0.002;
    var gm = Matrix.init_translate(t.x, t.y);
    console.log("translation:  ", t);
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
    console.log("b: ", b);
    this.element = e;
    this.grid = grid;
    e = this.grid;
    this.grid.style.setProperty("transform-origin", `${origin.x}px ${origin.y}px`);
    this.grid.style.setProperty("transform", "");
    this.grid.style.setProperty("transition", `transform 0.5s linear`);
    var tend = e => {
      console.log("transition end: ", e.target);
      console.log("transformOrigin: ", e.target.style.transformOrigin);
      console.log("dm: ", dm);
      e.target.style.transition = `transform 0.5s ease-out`;
      e.target.style.transform = dm.toString();
      e.target.removeEventListener("transitionend", tend);
    };
    e.addEventListener("transitionend", tend);
    console.log("rect: ", rect);
    e.style.setProperty("transition", `transform ${this.speed} ease-out`);
    e.style.setProperty("transform", dms);
    e.style.setProperty("z-index", 9);
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
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);
    let tree = this.tree;
    const items = this.props.items.filter(item => this.state.parentIds.indexOf(item.parent_id) != -1);
    console.log("Show.render");
    return (
      <div
        className={"page-layout"}
        onMouseMove={this.mouseEvent}
        onMouseDown={this.mouseEvent}
        onTransitionEnd={this.handleTransitionEnd}
      >
        <Head>
          <title>Show</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav loading={rootStore.state.loading} />
        <Tree tree={tree} minWidth={1024} active={this.state.active} /> {}
        <br />
        <br />
        <br />
        {this.state.view == "item" ? (
          <ItemView id={this.state.itemId} />
        ) : (
          <div className={"show-layout2"}>
            {tree ? (
              <DropdownTreeSelect
                data={tree}
                onChange={makeTreeSelEvent("change")}
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
            {}
            <div id={"item-grid"} style={{ margin: "0 0" }}>
              <div className={"grid-col grid-gap-20"}>
                {items.map(item => {
                  const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                  const haveImage = photo_id >= 0;
                  let photo = haveImage ? item.photos[0].photo : null;
                  const path = haveImage ? `/api/image/get/${photo_id}` : "/static/img/no-image.svg";
                  const opacity = photo_id >= 0 ? 1 : 0.3;
                  if(photo !== null) photo.landscape = photo.width > photo.height;
                  let { data, name, parent, type, children, users } = item;
                  try {
                    data = item.data && item.data.length && JSON.parse(item.data);
                  } catch(err) {
                    data = item.data;
                  }
                  if(typeof data != "object" || data === null) data = {};
                  if(!haveImage) return undefined;
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
                            className="gallery-image"
                          />
                        ) : (
                          undefined
                        )}
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
                          ) : (
                            undefined
                          )}
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
          <use href="#tree" />
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
      </div>
    );
  }
}

export default Show;
