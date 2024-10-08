import React from "react";
import Head from "next/head";
import { Element, HSLA, Point, Rect, Matrix, Timer } from "../lib/dom.js";
import { getAPI } from "../stores/api.js";
import Util from "../lib/util.js";
import { SvgOverlay } from "../lib/svg/overlay.js";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { ItemView } from "../components/views/itemView.js";
import { action, toJS } from "mobx";
import Nav from "../components/nav.js";
import { getOrCreateStore } from "../stores/createStore.js";
import affineFit from "affinefit";
import { fromTriangles } from "transformation-matrix";
import { trkl } from "../lib/trkl.js";
import { TreeView } from "../components/views/treeView.js";
import { makeItemToOption, findInTree } from "../stores/functions.js";

import DropdownTreeSelect from "react-dropdown-tree-select";

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

/*const makeItemToOption = selected => item => {
  let data = item && typeof item.data == "string" && item.data.length > 0 ? JSON.parse(item.data) : item && item.data != null && typeof item.data == "object" ? item.data : {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label, title: label, id: value, parent_id: item.parent_id, value, expanded: true, checked: selected === value };
  if(children && typeof children == "object" && children.length !== undefined) obj.children = children;
  else obj.children = [];
  if(label.startsWith("null(")) return null;
  if(!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;

  return obj;
};*/

@inject("rootStore")
@observer
class Show extends React.Component {
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

  static async getInitialProps(ctx) {
    Show.API = getAPI("http://127.0.0.1:8080/v1/graphql", {
      secret: "RUCXOZZjwWXeNxOOzNZBptPxCNl18H"
    });
    const { query, params } = (ctx && ctx.req) || {};
    //console.log("Show.getInitialProps ", { query, params });
    const { RootStore } = ctx.mobxStore;

    let items;
    try {
      if(params && params.id !== undefined) {
        let id = parseInt(params.id);
        const name = params.id;
        if(isNaN(id) || typeof id != "number") id = -1;
        const q = `query MyQuery { items(where: { _or: [ {id: {_eq: ${id}}}, {name:{_eq:"${name}"}}] }) { id data photos { photo { filesize colors  height width id offset uploaded original_name } } parent_id } }`;
        //console.log("query: ", q);
        let response = await Show.API(q);
        items = response.items || [];
      } else {
        items = await Show.API.list("items", Show.fields);
      }
      items = items.sort((a, b) => a.id - b.id);
      // console.log("items: ", items);
      if(typeof RootStore.items == "object" && RootStore.items.clear) RootStore.items.clear();
    } catch(e) {
      items = [];
    }
    return { items, params };
  }

  constructor(props) {
    super(props);
    this.api = getAPI(
      global.window && /192\.168/.test(window.location.href)
        ? "http://127.0.0.1:8080/v1/graphql"
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
    try {
      let tempTree = rootStore.getTree(rootStore.rootItemId, makeItemToOption(), null);

      function removeLeafs(tree) {
        let { children, ...node } = tree || {};
        if(children && children.length !== undefined)
          children = children.filter(child => !(!child.children || !child.children.length)).map(removeLeafs);
        return { children, ...node };
      }

      this.tree = removeLeafs(tempTree);

      if(this.props.params && this.props.params.id !== undefined) {
        this.state.view = "item";
        this.state.itemId = parseInt(this.props.params.id);
      } else if(this.tree) {
        var item = findInTree(this.tree, "Objects");
        if(item) item.checked = true;
        Util.traverseTree(item, i => i && this.state.parentIds.push(i.id));

        for(let node in Util.walkTree(this.tree)) {
          console.log("walkTree: ", node);
        }
      }
    } catch(e) {}
  }

  checkTagRemove() {
    if(global.window) {
      let tagRemove = Element.find("button.tag-remove");
      if(tagRemove) {
        tagRemove.addEventListener("click", e => {
          e.preventDefault();
          Timer.once(100, () => {
            //console.log("tagRemove: ", tagRemove);
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

    try {
      this.checkTagRemove();
    } catch(e) {}
  }

  componentDidUpdate() {
    try {
      this.checkTagRemove();
    } catch(e) {}
  }

  touchEvent = event => {
    //console.log("Touch event: ", event);
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
        //console.log("Mouse event: ", t);
        var parent = elem.parentElement;
        elem.style.setProperty("transition", "transform 1s cubic-bezier(0.19, 1, 0.22, 1)");
        elem.style.setProperty("transform", t);
        this.prevElem = elem;
        hover = getId(elem);
      }
    } else if(type.endsWith("down")) {
      var elem = r[0];
      //console.log("Mouse event: ", { type, x, y }, r);
      if(elem) {
        const id = getId(elem.parentElement);
        //console.log("Clicked id:", id);
        this.setState({ active: id });
      }
    }
  };

  @action.bound
  selectNode(item) {
    var children = Util.flatTree(item);
    var ids = children.map(child => child.id);
    //console.log("treeSelEvent: ", ids, item.title);
    this.setState({ parentIds: ids });
  }

  treeSelEvent(type, arg) {
    const { rootStore } = this.props;
    //console.log("treeSelEvent: ", type, arg);
    switch (type) {
      case "change": {
        //console.log("treeSelEvent: ", arg.value);
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
    var trn = affineFit(points, points2);
    var matrix = fromTriangles(points.slice(0, 3), points2.slice(0, 3));
    //console.log("matrix fromTriangles: ", matrix);
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
    this.grid.style.setProperty("transform-origin", `${origin.x}px ${origin.y}px`);
    this.grid.style.setProperty("transform", "");
    this.grid.style.setProperty("transition", `transform 0.5s linear`);
    var tend = e => {
      const { rootStore, router } = this.props;

      console.log("transition end: ", this.element);
      let itemId;
      if(this.element) {
        itemId = parseInt(this.element.getAttribute("id").replace(/item-/, ""));
        router.push(`/show/${itemId}`);
      }

      console.log("transformOrigin: ", e.target.style.transformOrigin);
      //console.log("dm: ", dm);
      e.target.style.transition = `transform 0.5s ease-out`;
      e.target.style.transform = dm.toString();
      e.target.removeEventListener("transitionend", tend);
    };
    e.addEventListener("transitionend", tend);
    //console.log("rect: ", rect);
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
    //console.log("Show.render" );
    return (
      <div className={"page-layout"} onMouseMove={this.mouseEvent} onMouseDown={this.mouseEvent}>
        <Head>
          <title>Show</title>
          <link rel='icon' href='favicon.ico' />
        </Head>
        <Nav loading={rootStore.state.loading} />
        <TreeView
          tree={tree}
          _treeVerify={node => {
            console.log("treeVerify: ", node);
            return typeof node == "object" && node !== null && (!node.children || node.children.length == 0);
          }}
          minWidth={1024}
          active={this.state.active}
        />{" "}
        {}
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
            ) : undefined}
            {}
            <div id={"item-grid"} style={{ margin: "0 0" }}>
              <div className={"grid-col grid-gap-20"}>
                {items.map((item, i) => {
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
                    <div key={i} className={"tile"} id={`item-${item.id}`} onClick={this.handleClick}>
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
            overflow: hidden;
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
