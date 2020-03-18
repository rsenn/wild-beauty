import React from "react";
import Head from "next/head";
import { Element, Point, Rect, Matrix, Timer, SVG, TRBL, Align, PointList } from "../lib/dom.js";
import { getAPI } from "../stores/api.js";
import Util from "../lib/util.js";
import { SvgOverlay } from "../lib/svg/overlay.js";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { ItemView } from "../components/views/itemView.js";
import { TreeView } from "../components/views/treeView.js";
import { Layout } from "../components/layout.js";
import { action } from "mobx";
import Nav from "../components/nav.js";
import { getOrCreateStore } from "../stores/createStore.js";
import { trkl } from "../lib/trkl.js";
import { Graph } from "../lib/fd-graph.js";
import { makeItemToOption, findInTree, treeToGraph } from "../stores/functions.js";
import { lazyInitializer } from "../lib/lazyInitializer.js";
import "../static/css/grid.css";
import DropdownTreeSelect from "react-dropdown-tree-select";
import "../static/css/react-dropdown-tree-select.css";
import { Queries } from "../stores/queries.js";
import { TreeGraph } from "../components/views/treeGraph.js";

var hier = {
  name: "[1]",
  children: [
    { name: "[41]", size: 10 },
    { name: "org", size: 10 },
    { name: "[57]", size: 10 },
    { name: "[58]", size: 10 },
    { name: "[59]", size: 10 },
    { name: "[60]", size: 10 },
    { name: "[61]", size: 10 },
    { name: "[62]", size: 10 },
    {
      name: "objects",
      children: [
        {
          name: "electronics",
          children: [
            { name: "[119]", size: 10 },
            { name: "[120]", size: 10 },
            { name: "[121]", size: 10 },
            { name: "[122]", size: 10 },
            { name: "[123]", size: 10 },
            { name: "[124]", size: 10 },
            {
              name: "pic",
              children: [
                { name: "lc-meter", size: 10 },
                { name: "rgb-led", size: 10 },
                { name: "picstick-25k50", size: 10 }
              ]
            },
            { name: "Audio", size: 10 },
            { name: "RS232", children: [{ name: "jdm2-programmer", size: 10 }] }
          ]
        },
        {
          name: "boxes",
          children: [
            { name: "[99]", size: 10 },
            { name: "[103]", size: 10 },
            { name: "[98]", size: 10 },
            { name: "[86]", size: 10 },
            { name: "Test", size: 10 }
          ]
        },
        { name: "bags", children: [{ name: "[64]", size: 10 }] }
      ]
    },
    {
      name: "subjects",
      children: [
        {
          name: "[89]",
          children: [
            { name: "[105]", size: 10 },
            { name: "Roman", size: 10 }
          ]
        },
        { name: "groups", size: 10 }
      ]
    }
  ]
};

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

export function createGraph(svg, nodeType = SVG) {
  let d = nodeType.create("defs", {}, svg);
  let lg = nodeType.create("linearGradient", { id: "lg1", x1: 0, y1: 0, x2: 0, y2: 100, spreadMethod: "pad" }, d);
  nodeType.create("stop", { offset: 0, stopColor: "#00cc00", stopOpacity: 1 }, lg);
  nodeType.create("stop", { offset: 100, stopColor: "#006600", stopOpacity: 1 }, lg);

  svg = nodeType.create("g", {}, svg);

  let strokeWidth = 1.1;

  let g = new Graph({
    origin: new Point(0, 0),
    gravitate_to_origin: true,
    spacing: 12,
    timestep: 300,
    onRenderGraph: graph => {
      let bb = new Rect(svg.getBBox()).round();
      let client = nodeType.rect(svg.parentElement);
      let trbl = new TRBL(50, 20, 50, 20);
      let aspect = bb.aspect();

      client = client.inset(200);

      let m = Matrix.getAffineTransform(bb, client);

      if(m.xx > m.yy) m.scale(m.yy / m.xx, 1);
      let t = m.toSVG();
      nodeType.attr(svg, { transform: t });
      bb = new Rect(svg.getBBox());
      let gcenter = bb.center;
      let move = Point.diff(nodeType.rect(svg.parentElement).center, gcenter);

      m.translate(move.x / m.xx, 0);
      nodeType.attr(svg, { transform: m.toSVG() });
      t = ` translate(${move.x},${move.y}) ` + t;

      let gbb = graph.getBBox();
      let rbb = new Rect(gbb);
      let nbb = new Rect(rbb);

      Rect.align(nbb, client, Align.CENTER | Align.MIDDLE);
      console.log("nbb:", nbb);
      nodeType.create("circle", { cx: rbb.center.x, cy: rbb.center.y, r: 30, stroke: "#f00", strokeWidth: 2, fill: "none" }, svg);
    },
    onUpdateNode: (node, i) => {
      if(!node.element) {
        node.element = nodeType.create(
          "g",
          {
            id: `node-${i}`,
            transform: `translate(${node.x},${node.y})`,
            fill: "#00f",
            stroke: "#000",
            strokeWidth: 1
          },
          svg
        );
        nodeType.create(
          "rect",
          {
            x: -16,
            y: -17,
            width: 32,
            height: 32,
            rx: 1.5,
            ry: 1.5,
            fill: "#ffdd00",
            stroke: "#000",
            strokeWidth
          },
          node.element
        );
        nodeType.create("tspan", { alignmentBaseline: "middle", text: node.label }, nodeType.create("text", { fontSize: 10, fill: "#000", stroke: "none", textAnchor: "middle" }, node.element));
      } else nodeType.attr(node.element, { transform: `translate(${node.x},${node.y})` });
    },
    onUpdateEdge: (edge, i) => {
      const { x1, y1, x2, y2 } = edge;
      if(!edge.element) edge.element = nodeType.create("line", { id: `edge-${i}`, x1, y1, x2, y2, stroke: "#000", strokeWidth }, svg);
      else nodeType.attr(edge.element, { x1, y1, x2, y2 });
    }
  });

  treeToGraph(g, hier);

  return g;
}

@inject("rootStore")
@observer
class TreePage extends React.Component {
  state = {
    zIndex: 99999,
    tree: {},
    parentIds: [],
    view: "list",
    currentItem: null
  };
  static API = getAPI("http://wild-beauty.herokuapp.com/v1/graphql", {
    secret: "RUCXOZZjwWXeNxOOzNZBptPxCNl18H"
  });

  static fields = ["id", "type", "parent_id", "parent { id type data }", "children { id type data }", "data", "photos { photo { id width height filesize colors original_name } }", "users { user { id username last_seen } }"];

  svgRef = trkl();

  svg = lazyInitializer(() =>
    SVG.create(
      "svg",
      {
        id: "graph-svg",
        width: window.innerWidth,
        height: window.innerHeight,
        style: "position: absolute; left: 0; top: 0; z-index: 1000001; pointer-events: none;"
      },
      document.body
    )
  );

  static async getInitialProps(ctx) {
    const { query, params } = (ctx && ctx.req) || {};
    console.log("TreePage.getInitialProps ", { query, params });
    const rootStore = ctx.mobxStore["RootStore"];

    let fields = ["id", "name", "type", "parent_id", "parent { id }", "order", "children(order_by: {order: asc}) { id name type }", "data", "photos { photo { id colors } }", "users { user { id } }", "children_aggregate { aggregate {count } }"];
    let items = await rootStore.api.list("items", fields, { where: "{visible: {_eq: true}},order_by:{parent: {id: asc}, order: asc, created: asc}" });

    //   console.log('Tree.getInitialProps items=', items);
    /*      let items;
    if(params && params.id !== undefined) {
      let id = parseInt(params.id);
      const name = params.id;
      if(isNaN(id) || typeof id != "number") id = -1;
      const q = `query MyQuery { items(where: { _or: [ {id: {_eq: ${id}}}, {name:{_eq:"${name}"}}] }) { id data photos { photo { filesize colors height width id offset uploaded original_name } } parent_id } }`;
      let response = await TreePage.API(q);
      items = response.items || [];
      console.log("item: ", items[0]);
    } else {
      items = await TreePage.API.list("items", TreePage.fields);
    }
*/
    items = items.sort((a, b) => a.id - b.id);
    if(rootStore.items && rootStore.items.clear) rootStore.items.clear();
    items = items.map(item => rootStore.newItem(item));

    let rootItem = rootStore.getTree(1);

    //  let root = rootStore.getItem(rootItem.id);
    let g = new Graph({
      origin: new Point(0, 0),
      gravitate_to_origin: true,
      spacing: 12,
      timestep: 300
    });
    let iter = Object.fromEntries([
      ...rootStore.entries(({ photos, children, users, key, ...item }) => {
        item = toJS(item);
        if(!item.type) delete item.type;
        if(!Util.isEmpty(item.data)) delete item.data;
        return item;
      })
    ]);
    for(let key in iter) {
      let { parent, childIds, children, ...item } = iter[key];
      let parent_id = parent && parent.id;
      let depth = ((iter[parent_id] && iter[parent_id].depth) || 0) + 1;
      let p;
      if(parent_id > 0) {
        iter[key].parent = iter[parent_id];
      }
      item = iter[key];
      item.depth = depth;
      if(childIds.length) item.children = childIds.map(id => iter[id]);

      if(item.data === null || Util.isEmpty(item.data)) delete item.data;
    }

    let root = rootStore.getTree(rootItem.id, it => Util.filterOutKeys(toJS(it), ["childIds", "users"]));

    //console.log("root:", toJS(root));

    treeToGraph(g, root, item => {
      let { children, parent, users, photos, ...restOfItem } = item;
      let parent_id = parent && parent.id;
      if(parent_id !== undefined) item.parent_id = parent_id;
      let numChildren = children ? children.length : 0;
      let output = { itemKeys: Object.keys(item), parent_id, restOfItem };
      if(numChildren) item.num_children = numChildren;
      if(item.photos && item.photos[0] && item.photos[0].photo) {
        let photo = item.photos[0].photo;
        let colors =   Util.jsonToObject(photo.colors);
        let color = Object.keys(colors)[0];
        console.log("color:", color);
              item.color = color;

      }

      // if(!numChildren && !(item.type && item.type.endsWith("category"))) return false;
      console.log("item: ", Util.filterOutKeys(item, ["children", "num_children", "parent"]));
      return true;
    });

    /*
    for(let i in g.nodes) {
      let n = g.nodes[i];
      n.x = n.x ? parseFloat(n.x.toFixed(3)) : 0;
      n.y = n.y ? parseFloat(n.y.toFixed(3)) : 0;

      delete n.parent;
      delete n.children;
    }
    for(let i in g.edges) {
      let e = g.edges[i];

      if(e.a) {
        delete e.a.parent;
        delete e.a.children;
      }
      if(e.b) {
        delete e.b.parent;
        delete e.b.children;
      }
    }*/

   while(!g.done_rendering)
    g.checkRedraw();


    g.roundAll(0.003);

    console.log("g:", g);

    let bbox = PointList.bbox(g.nodes);
    let rect = new Rect(bbox);
    let center = rect.center;

    g.translate(-center.x, -center.y);

    console.log("g.bbox: ", bbox);
    console.log("g.rect: ", rect);
    console.log("center: ", center);
    console.log("g: ", g.serialize());

    /* let pl = g.points;




*/
    // console.log("root: ", root);

    let nodes = [
      ...Util.walkTree(
        root,
        item => true,
        item => {
          delete item.parent;
          return item;
        }
      )
    ];

    for(let n of nodes) {
      let node = Util.filterOutKeys(n, ["children", "parent"]);
      console.log("walkTree node=", Util.inspect(node, { newline: "", indent: "", spacing: " " }));
    }

    //  let nodes = TreeView({ tree: root }, false);
    /*
    for(let node of Util.walkTree(nodes[0])) {
      //console.log("Tree.constructor node: ", Util.inspect(Util.filterOutKeys(node, ["children", "key"]), { newline: "", indent: "", spacing: " " }));
    }*/

    return { params, items, tree: root, nodes, graph: g.serialize() };
  }

  constructor(props) {
    super(props);
    this.api = getAPI(global.window && /192\.168/.test(window.location.href) ? "http://wild-beauty.herokuapp.com/v1/graphql" : "/v1/graphql", { secret: "RUCXOZZjwWXeNxOOzNZBptPxCNl18H" });
    const { rootStore } = this.props;

    /*    this.tree = this.props.tree;
     */

    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      window.stores = getOrCreateStore();
    }
    rootStore.items.clear();
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

    let r = new Matrix();

    r.translate(bc.x, bc.y);

    r.rotate((-15 * Math.PI) / 180);
    r.translate(-bc.x, -bc.y);

    let dr = null;
    if(global.window) {
      dr = new DOMMatrix();
      dr.translateSelf(bc.x, bc.y);

      dr.rotateSelf(-15);

      dr.translateSelf(-bc.x, -bc.y);
    }

    let m = Matrix.getAffineTransform(a, b);
    let c = new Rect(b);
    let c2 = c.toPoints();
    c = c.toPoints();
    r.transform_points(c);
    this.b = b;
    this.c = c;
    this.a = a;
  }

  checkTagRemove() {
    if(global.window) {
      let tagRemove = Element.find("button.tag-remove");
      if(tagRemove) {
        tagRemove.addEventListener("click", e => {
          e.preventDefault();
          Timer.once(100, () => {
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

  touchEvent = event => {};

  mouseEvent = event => {
    const { target, nativeEvent } = event;
    const { type, clientX, clientY, pageX: x, pageY: y } = nativeEvent;
    if(!this.rects) {
      this.rects = Element.findAll("rect");
    }
    var r = this.rects.filter(rect => Rect.inside(Element.rect(rect), { x, y }));

    if(type.endsWith("move")) {
      var elem = r[0] && r[0].parentElement;
      var hover = -1;

      if(!elem) return;

      if(this.prevElem && this.prevElem.style) {
        if(this.prevElem == elem) return;
        this.prevElem.style.removeProperty("transform");
        hover = -1;
      }
      if(elem && elem.style) {
        const t = ` scale(1.4,1.4)`;

        var parent = elem.parentElement;
        elem.style.setProperty("transition", "transform 1s cubic-bezier(0.19, 1, 0.22, 1)");
        elem.style.setProperty("transform", t);
        this.prevElem = elem;
        hover = getId(elem);
      }
    } else if(type.endsWith("down")) {
      var elem = r[0];

      if(elem) {
        const id = getId(elem.parentElement);

        this.setState({ active: id });
      }
    }
    function getNum(elem, name) {
      return parseFloat(elem.getAttribute(name));
    }
    function getId(elem) {
      return parseInt((''+elem.getAttribute("id")).replace(/.*\./, ""));
    }
  };

  @action.bound
  selectNode(item) {
    var children = Util.flatTree(item);
    var ids = children.map(child => child.id);

    this.setState({ parentIds: ids });
  }

  treeSelEvent(type, arg) {
    const { rootStore } = this.props;

    switch (type) {
      case "change": {
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
      if(e !== event.currentTarget) Element.setCSS(e, { transition: "transform 0.2s ease-in", transform: "", zIndex: 8 });
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

    var srect = new Rect({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    var size = Math.min(rect2.width, window.innerHeight - 20, window.innerWidth - 20);
    var pt = new Point(srect.center);
    pt.y += window.scrollY;
    var t = Point.diff(pt, rect.center);
    var origin = Point.diff(rect.center, rect2);
    var distance = Math.sqrt(t.x * t.x + t.y * t.y);
    this.speed = distance * 0.002;
    var gm = Matrix.init_translate(t.x, t.y);

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

    this.element = e;
    this.grid = grid;
    e = this.grid;
    this.grid.style.setProperty("transform-origin", `${origin.x}px ${origin.y}px`);
    this.grid.style.setProperty("transform", "");
    this.grid.style.setProperty("transition", `transform 0.5s linear`);
    var tend = e => {
      e.target.style.transition = `transform 0.5s ease-out`;
      e.target.style.transform = dm.toString();
      e.target.removeEventListener("transitionend", tend);
    };
    e.addEventListener("transitionend", tend);

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
    const items = [];
    const isServer = Util.isServer();
    console.log("TreePage.render", { isServer });
    return (
      <Layout title={"Tree"} onMouseMove={e => { /*this.mouseEvent*/ }} onMouseDown={this.mouseEvent} onTransitionEnd={this.handleTransitionEnd}>
        <TreeGraph graph={this.props.graph} />
        <br />
        {this.state.view == "item" ? (
          <ItemView id={this.state.itemId} />
        ) : (
          <div className={"show-layout2"}>
            {tree ? <DropdownTreeSelect data={tree} onChange={makeTreeSelEvent("change")} onNodeToggle={makeTreeSelEvent("node-toggle")} onFocus={makeTreeSelEvent("focus")} onBlur={makeTreeSelEvent("blur")} className={"dropdown-tree"} mode={"radioSelect"} texts={{ placeholder: "parent item" }} /> : undefined}
            {}
            <div id={"item-grid"} style={{ margin: "0 0" }}>
              <div className={"grid-col grid-gap-20"}>
                {items.map(item => {
                  const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                  const haveImage = photo_id >= 0;
                  let photo = haveImage ? item.photos[0].photo : null;
                  const path = haveImage ? `/api/photo/get/${photo_id}` : "/static/img/no-image.svg";
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
                            className='gallery-image'
                          />
                        ) : (
                          undefined
                        )}
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
                            {[...Object.entries(data)].map(([key, value]) => (key == "title" ? value : `${Util.ucfirst(key)}: ${value}`)).join("\n")}
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

export default TreePage;
