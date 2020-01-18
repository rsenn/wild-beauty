import React from "react";
import Head from "next/head";
import { Element, HSLA, PointList, Point, Rect, Matrix, Timer } from "../utils/dom.js";
import getAPI from "../stores/api.js";
import Util from "../utils/util.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { ItemView } from "../components/views/itemView.js";
import { Tree } from "../components/tree.js";
import { Graph } from "../components/graph.js";
import { action, toJS } from "mobx";
import Nav from "../components/nav.js";
import { getOrCreateStore } from "../stores/createStore.js";
import affineFit from "affinefit";
import { fromTriangles } from "transformation-matrix";
import { MovementListener, TouchListener } from "../utils/touchHandler.js";
import { trkl } from "../utils/trkl.js";

import "../static/css/grid.css";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../static/css/react-dropdown-tree-select.css";
import { SizeMe, withSize } from "react-sizeme";

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

const findInTree = (tree, value) => {
  if(tree.value === value || tree.label === value) return tree;
  if(tree.children) {
    for(let child of tree.children) {
      let ret = findInTree(child, value);
      if(ret !== null) return ret;
    }
  }
  return null;
};

const makeItemToOption = selected => item => {
  let data =
    item && typeof item.data == "string" && item.data.length > 0
      ? JSON.parse(item.data)
      : item && item.data != null && typeof item.data == "object"
      ? item.data
      : {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = {
    label,
    title: label,
    id: value,
    parent_id: item.parent_id,
    value,
    expanded: true,
    checked: selected === value
  };
  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  if(!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;
  //if(item.parent_id != -1 && item.parent_id != 1 && item.type !== null && !item.type.endsWith('category')) return null;
  return obj;
};

@inject("rootStore")
@observer
class Browse extends React.Component {
  state = {
    zIndex: 99999,
    tree: {},
    parentIds: [],
    view: "list"
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
    console.log("Browse.getInitialProps ", { query, params });
    const { RootStore } = ctx.mobxStore;
    //console.log("RootStore.fetchItems");
    let items;

    if(params && params.id !== undefined) {
      let id = parseInt(params.id);
      const name = params.id;
      if(isNaN(id) || typeof id != "number") id = -1;
      const q = `query MyQuery { items(where: { _or: [ {id: {_eq: ${id}}}, {name:{_eq:"${name}"}}] }) { id data photos { photo { filesize height width id offset uploaded original_name } } parent_id } }`;
      console.log("query: ", q);
      let response = await Browse.API(q);
      items = response.items || [];
      //console.log("item: ", items[0]);
    } else {
      items = await Browse.API.list("items", Browse.fields);
    }
    //await RootStore.fetchItems();
    // console.log("Browse.getInitialProps  items:", items);
    items = items.sort((a, b) => a.id - b.id);
    RootStore.items.clear();
    //  items.forEach(item => RootStore.newItem(item));
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

      //   window.addEventListener('mousemove', this.mouseMove);
    }
    //console.log("props.items: ", props.items);
    rootStore.items.clear();

    /*    props.items.forEach(item => {
      rootStore.newItem(item);
    });
*/

    //console.log("rootItemId: ", rootStore.rootItemId);
    this.tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());

    if(this.props.params && this.props.params.id !== undefined) {
      this.state.view = "item";
      this.state.itemId = parseInt(this.props.params.id);
    } else if(this.tree) {
      var item = findInTree(this.tree, "Objects");
      item.checked = true;
      Util.traverseTree(item, i => this.state.parentIds.push(i.id));
    }
    /*
     this.touchListener = TouchListener(this.touchEvent,
      f        element: global.window,
        step: 10,
        round: false,
        listener: MovementListener,
        noscroll: true
      }
    );*/

    /*  this.svgRef.subscribe(ref => {
      var r = Element.rect('#tree');
      const {x,y} = r;
     var e =  ref.factory('use', { href: '#tree', x, y }, ref.svg);
      console.log("svgRef: ", e);   
    });*/
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
        /*  parent.removeChild(elem);
        parent.appendChild(elem);*/
        elem.style.setProperty("transition", "transform 1s cubic-bezier(0.19, 1, 0.22, 1)");

        elem.style.setProperty("transform", t);
        this.prevElem = elem;
        hover = getId(elem);
      }
      // this.setState({ hover });
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
          //  this.tree = rootStore.getItem(this.state.node, makeItemToOption());
          this.selectNode(item);
        }
        //rootStore.setState({ selected: arg.value });
        break;
      }
      default: {
        break;
      }
    }
  }

  handleClick = event => {
    const { nativeEvent } = event;
    console.log("handleClick", event.buttons, nativeEvent.buttons, nativeEvent);
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
      /*    e.style.setProperty("transition", "transform 0.2s ease-in");*/
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
    //console.log("handleClick:\nrect: ", rect.toString(), "\npoints: ", PointList.toString(points), "\nrect2: ", rect2.toString(), "\npoints2: ", PointList.toString(points2));
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
    //m = Matrix.scale.apply(Matrix, scale);
    //console.log("matrix: ", m);
    var dm = new DOMMatrix();

    dm.translateSelf(t.x, t.y);
    dm.scaleSelf(scale[0], scale[1]);

    var dms = dm.toString();

    console.log("b: ", b);

    //  Element.setCSS(back, { opacity: 1 });
    //  Element.setCSS(back, Rect.toCSS(brect));
    //    Element.setCSS(back, { left: 0, top: 0, width: `${window.innerWidth}px`, height: `${window.innerHeight}px` });
    this.element = e;

    this.grid = grid;
    e = this.grid;

    this.grid.style.setProperty("transform-origin", `${origin.x}px ${origin.y}px`);
    this.grid.style.setProperty("transform", "");
    this.grid.style.setProperty("transition", `transform 0.5s linear`);
    //    Element.setCSS(this.grid, { /*transformOrigin:  `${origin.x}px ${origin.y}px`, *//*transition: `transform ${this.speed}s ease-in`,*/ transform: "", zIndex: 8 });

    var tend = e => {
      console.log("transition end: ", e.target);
      console.log("transformOrigin: ", e.target.style.transformOrigin);
      /* gm.xx *= scale[0];
    gm.yy *= scale[1];*/

      /*   dm = new DOMMatrix();
      var t2 = Point.diff(srect.center, rect.center);
      dm.translateSelf(0, rect.height + rect2.y + window.scrollY);

      dm.translateSelf(t2.x, t2.y);*/
      //  dm.scaleSelf(scale[0], scale[1]);
      console.log("dm: ", dm);
      // var gm2 = Matrix.scale(gm, scale[0], scale[1]);
      e.target.style.transition = `transform 0.5s ease-out`;

      e.target.style.transform = /*Matrix.toDOMMatrix(gm)*/ dm.toString();
      /* let back = Element.create("div", {
        parent: document.body,
        style: {
         background: "url(/static/img/tile-background.png) repeat",
          backgroundSize: "auto 50vmin",
          zIndex: 8,
          position: "fixed",
          ...Rect.toCSS(Element.rect(e.target)),
          //  transition: 'opacity 1s ease-in-out'
          transition: "left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out"
        }
      });
      this.back = back;
      Element.setCSS(back, Rect.toCSS(brect));*/
      e.target.removeEventListener("transitionend", tend);
    };

    e.addEventListener("transitionend", tend);
    console.log("rect: ", rect);

    /*  back.style.setProperty("opacity", 1);
   });
*/
    e.style.setProperty("transition", `transform ${this.speed} ease-out`);
    e.style.setProperty("transform", dms);
    // e.style.setProperty("background-color", "white");
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
      //console.log("onChange: ", value);
    };

    if(global.window) {
      window.addEventListener("resize", event => {
        const { currentTarget, target } = event;
        //console.log("Resized: ", { currentTarget, target });
      });
    }
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);
    let tree = this.tree;
    const items = this.props.items
      ? this.props.items.filter(item => this.state.parentIds.indexOf(item.parent_id) != -1)
      : [];
    console.log("Browse.render" /*, { tree, items }*/);
    const json = `{"links":[{"source":"Napoleon","target":"Myriel","value":1},{"value":8,"target":"Myriel","source":"Mlle.Baptistine"},{"target":"Myriel","value":10,"source":"Mme.Magloire"},{"source":"Mme.Magloire","target":"Mlle.Baptistine","value":6},{"source":"CountessdeLo","value":1,"target":"Myriel"},{"target":"Myriel","value":1,"source":"Geborand"},{"value":1,"target":"Myriel","source":"Champtercier"},{"value":1,"target":"Myriel","source":"Cravatte"},{"value":2,"target":"Myriel","source":"Count"},{"source":"OldMan","value":1,"target":"Myriel"},{"value":1,"target":"Labarre","source":"Valjean"},{"source":"Valjean","value":3,"target":"Mme.Magloire"},{"value":3,"target":"Mlle.Baptistine","source":"Valjean"},{"target":"Myriel","value":5,"source":"Valjean"},{"source":"Marguerite","value":1,"target":"Valjean"},{"source":"Mme.deR","target":"Valjean","value":1},{"target":"Valjean","value":1,"source":"Isabeau"},{"target":"Valjean","value":1,"source":"Gervais"},{"target":"Tholomyes","value":4,"source":"Listolier"},{"value":4,"target":"Tholomyes","source":"Fameuil"},{"source":"Fameuil","value":4,"target":"Listolier"},{"source":"Blacheville","target":"Tholomyes","value":4},{"target":"Listolier","value":4,"source":"Blacheville"},{"value":4,"target":"Fameuil","source":"Blacheville"},{"target":"Tholomyes","value":3,"source":"Favourite"},{"target":"Listolier","value":3,"source":"Favourite"},{"value":3,"target":"Fameuil","source":"Favourite"},{"value":4,"target":"Blacheville","source":"Favourite"},{"target":"Tholomyes","value":3,"source":"Dahlia"},{"target":"Listolier","value":3,"source":"Dahlia"},{"target":"Fameuil","value":3,"source":"Dahlia"},{"target":"Blacheville","value":3,"source":"Dahlia"},{"source":"Dahlia","value":5,"target":"Favourite"},{"source":"Zephine","value":3,"target":"Tholomyes"},{"source":"Zephine","target":"Listolier","value":3},{"value":3,"target":"Fameuil","source":"Zephine"},{"value":3,"target":"Blacheville","source":"Zephine"},{"source":"Zephine","target":"Favourite","value":4},{"source":"Zephine","value":4,"target":"Dahlia"},{"value":3,"target":"Tholomyes","source":"Fantine"},{"value":3,"target":"Listolier","source":"Fantine"},{"value":3,"target":"Fameuil","source":"Fantine"},{"source":"Fantine","target":"Blacheville","value":3},{"value":4,"target":"Favourite","source":"Fantine"},{"source":"Fantine","target":"Dahlia","value":4},{"source":"Fantine","target":"Zephine","value":4},{"target":"Marguerite","value":2,"source":"Fantine"},{"source":"Fantine","target":"Valjean","value":9},{"target":"Fantine","value":2,"source":"Mme.Thenardier"},{"source":"Mme.Thenardier","target":"Valjean","value":7},{"target":"Mme.Thenardier","value":13,"source":"Thenardier"},{"source":"Thenardier","target":"Fantine","value":1},{"source":"Thenardier","value":12,"target":"Valjean"},{"target":"Mme.Thenardier","value":4,"source":"Cosette"},{"source":"Cosette","value":31,"target":"Valjean"},{"source":"Cosette","target":"Tholomyes","value":1},{"target":"Thenardier","value":1,"source":"Cosette"},{"source":"Javert","target":"Valjean","value":17},{"source":"Javert","value":5,"target":"Fantine"},{"source":"Javert","value":5,"target":"Thenardier"},{"value":1,"target":"Mme.Thenardier","source":"Javert"},{"value":1,"target":"Cosette","source":"Javert"},{"source":"Fauchelevent","target":"Valjean","value":8},{"target":"Javert","value":1,"source":"Fauchelevent"},{"target":"Fantine","value":1,"source":"Bamatabois"},{"source":"Bamatabois","value":1,"target":"Javert"},{"target":"Valjean","value":2,"source":"Bamatabois"},{"source":"Perpetue","target":"Fantine","value":1},{"source":"Simplice","value":2,"target":"Perpetue"},{"source":"Simplice","target":"Valjean","value":3},{"value":2,"target":"Fantine","source":"Simplice"},{"source":"Simplice","value":1,"target":"Javert"},{"value":1,"target":"Valjean","source":"Scaufflaire"},{"source":"Woman1","value":2,"target":"Valjean"},{"value":1,"target":"Javert","source":"Woman1"},{"source":"Judge","value":3,"target":"Valjean"},{"value":2,"target":"Bamatabois","source":"Judge"},{"source":"Champmathieu","target":"Valjean","value":3},{"value":3,"target":"Judge","source":"Champmathieu"},{"target":"Bamatabois","value":2,"source":"Champmathieu"},{"source":"Brevet","target":"Judge","value":2},{"target":"Champmathieu","value":2,"source":"Brevet"},{"target":"Valjean","value":2,"source":"Brevet"},{"value":1,"target":"Bamatabois","source":"Brevet"},{"value":2,"target":"Judge","source":"Chenildieu"},{"source":"Chenildieu","target":"Champmathieu","value":2},{"source":"Chenildieu","target":"Brevet","value":2},{"value":2,"target":"Valjean","source":"Chenildieu"},{"target":"Bamatabois","value":1,"source":"Chenildieu"},{"target":"Judge","value":2,"source":"Cochepaille"},{"source":"Cochepaille","value":2,"target":"Champmathieu"},{"source":"Cochepaille","value":2,"target":"Brevet"},{"source":"Cochepaille","target":"Chenildieu","value":2},{"source":"Cochepaille","target":"Valjean","value":2},{"target":"Bamatabois","value":1,"source":"Cochepaille"},{"source":"Pontmercy","target":"Thenardier","value":1},{"source":"Boulatruelle","value":1,"target":"Thenardier"},{"value":2,"target":"Mme.Thenardier","source":"Eponine"},{"target":"Thenardier","value":3,"source":"Eponine"},{"source":"Anzelma","value":2,"target":"Eponine"},{"source":"Anzelma","value":2,"target":"Thenardier"},{"source":"Anzelma","target":"Mme.Thenardier","value":1},{"value":3,"target":"Valjean","source":"Woman2"},{"source":"Woman2","value":1,"target":"Cosette"},{"value":1,"target":"Javert","source":"Woman2"},{"value":3,"target":"Fauchelevent","source":"MotherInnocent"},{"source":"MotherInnocent","target":"Valjean","value":1},{"value":2,"target":"Fauchelevent","source":"Gribier"},{"target":"Jondrette","value":1,"source":"Mme.Burgon"},{"target":"Mme.Burgon","value":2,"source":"Gavroche"},{"source":"Gavroche","target":"Thenardier","value":1},{"source":"Gavroche","target":"Javert","value":1},{"target":"Valjean","value":1,"source":"Gavroche"},{"source":"Gillenormand","target":"Cosette","value":3},{"source":"Gillenormand","target":"Valjean","value":2},{"target":"Gillenormand","value":1,"source":"Magnon"},{"value":1,"target":"Mme.Thenardier","source":"Magnon"},{"source":"Mlle.Gillenormand","target":"Gillenormand","value":9},{"source":"Mlle.Gillenormand","value":2,"target":"Cosette"},{"source":"Mlle.Gillenormand","target":"Valjean","value":2},{"source":"Mme.Pontmercy","target":"Mlle.Gillenormand","value":1},{"target":"Pontmercy","value":1,"source":"Mme.Pontmercy"},{"value":1,"target":"Mlle.Gillenormand","source":"Mlle.Vaubois"},{"value":2,"target":"Mlle.Gillenormand","source":"Lt.Gillenormand"},{"value":1,"target":"Gillenormand","source":"Lt.Gillenormand"},{"value":1,"target":"Cosette","source":"Lt.Gillenormand"},{"target":"Mlle.Gillenormand","value":6,"source":"Marius"},{"source":"Marius","target":"Gillenormand","value":12},{"target":"Pontmercy","value":1,"source":"Marius"},{"value":1,"target":"Lt.Gillenormand","source":"Marius"},{"source":"Marius","target":"Cosette","value":21},{"target":"Valjean","value":19,"source":"Marius"},{"value":1,"target":"Tholomyes","source":"Marius"},{"source":"Marius","target":"Thenardier","value":2},{"source":"Marius","value":5,"target":"Eponine"},{"source":"Marius","value":4,"target":"Gavroche"},{"value":1,"target":"Gillenormand","source":"BaronessT"},{"source":"BaronessT","value":1,"target":"Marius"},{"source":"Mabeuf","value":1,"target":"Marius"},{"source":"Mabeuf","value":1,"target":"Eponine"},{"source":"Mabeuf","value":1,"target":"Gavroche"},{"source":"Enjolras","target":"Marius","value":7},{"value":7,"target":"Gavroche","source":"Enjolras"},{"source":"Enjolras","target":"Javert","value":6},{"target":"Mabeuf","value":1,"source":"Enjolras"},{"target":"Valjean","value":4,"source":"Enjolras"},{"source":"Combeferre","target":"Enjolras","value":15},{"value":5,"target":"Marius","source":"Combeferre"},{"source":"Combeferre","value":6,"target":"Gavroche"},{"target":"Mabeuf","value":2,"source":"Combeferre"},{"target":"Gavroche","value":1,"source":"Prouvaire"},{"value":4,"target":"Enjolras","source":"Prouvaire"},{"target":"Combeferre","value":2,"source":"Prouvaire"},{"target":"Gavroche","value":2,"source":"Feuilly"},{"value":6,"target":"Enjolras","source":"Feuilly"},{"value":2,"target":"Prouvaire","source":"Feuilly"},{"target":"Combeferre","value":5,"source":"Feuilly"},{"target":"Mabeuf","value":1,"source":"Feuilly"},{"target":"Marius","value":1,"source":"Feuilly"},{"target":"Marius","value":9,"source":"Courfeyrac"},{"value":17,"target":"Enjolras","source":"Courfeyrac"},{"value":13,"target":"Combeferre","source":"Courfeyrac"},{"target":"Gavroche","value":7,"source":"Courfeyrac"},{"source":"Courfeyrac","value":2,"target":"Mabeuf"},{"value":1,"target":"Eponine","source":"Courfeyrac"},{"target":"Feuilly","value":6,"source":"Courfeyrac"},{"value":3,"target":"Prouvaire","source":"Courfeyrac"},{"value":5,"target":"Combeferre","source":"Bahorel"},{"source":"Bahorel","value":5,"target":"Gavroche"},{"source":"Bahorel","value":6,"target":"Courfeyrac"},{"target":"Mabeuf","value":2,"source":"Bahorel"},{"source":"Bahorel","value":4,"target":"Enjolras"},{"source":"Bahorel","target":"Feuilly","value":3},{"target":"Prouvaire","value":2,"source":"Bahorel"},{"source":"Bahorel","target":"Marius","value":1},{"target":"Marius","value":5,"source":"Bossuet"},{"target":"Courfeyrac","value":12,"source":"Bossuet"},{"source":"Bossuet","target":"Gavroche","value":5},{"source":"Bossuet","target":"Bahorel","value":4},{"target":"Enjolras","value":10,"source":"Bossuet"},{"value":6,"target":"Feuilly","source":"Bossuet"},{"target":"Prouvaire","value":2,"source":"Bossuet"},{"source":"Bossuet","value":9,"target":"Combeferre"},{"source":"Bossuet","target":"Mabeuf","value":1},{"target":"Valjean","value":1,"source":"Bossuet"},{"source":"Joly","target":"Bahorel","value":5},{"value":7,"target":"Bossuet","source":"Joly"},{"source":"Joly","value":3,"target":"Gavroche"},{"source":"Joly","value":5,"target":"Courfeyrac"},{"value":5,"target":"Enjolras","source":"Joly"},{"source":"Joly","target":"Feuilly","value":5},{"target":"Prouvaire","value":2,"source":"Joly"},{"target":"Combeferre","value":5,"source":"Joly"},{"value":1,"target":"Mabeuf","source":"Joly"},{"source":"Joly","target":"Marius","value":2},{"target":"Bossuet","value":3,"source":"Grantaire"},{"value":3,"target":"Enjolras","source":"Grantaire"},{"target":"Combeferre","value":1,"source":"Grantaire"},{"source":"Grantaire","value":2,"target":"Courfeyrac"},{"source":"Grantaire","value":2,"target":"Joly"},{"value":1,"target":"Gavroche","source":"Grantaire"},{"source":"Grantaire","value":1,"target":"Bahorel"},{"source":"Grantaire","value":1,"target":"Feuilly"},{"source":"Grantaire","value":1,"target":"Prouvaire"},{"value":3,"target":"Mabeuf","source":"MotherPlutarch"},{"target":"Thenardier","value":5,"source":"Gueulemer"},{"value":1,"target":"Valjean","source":"Gueulemer"},{"source":"Gueulemer","target":"Mme.Thenardier","value":1},{"target":"Javert","value":1,"source":"Gueulemer"},{"source":"Gueulemer","target":"Gavroche","value":1},{"source":"Gueulemer","target":"Eponine","value":1},{"value":6,"target":"Thenardier","source":"Babet"},{"value":6,"target":"Gueulemer","source":"Babet"},{"source":"Babet","target":"Valjean","value":1},{"source":"Babet","target":"Mme.Thenardier","value":1},{"value":2,"target":"Javert","source":"Babet"},{"target":"Gavroche","value":1,"source":"Babet"},{"target":"Eponine","value":1,"source":"Babet"},{"source":"Claquesous","value":4,"target":"Thenardier"},{"value":4,"target":"Babet","source":"Claquesous"},{"target":"Gueulemer","value":4,"source":"Claquesous"},{"source":"Claquesous","target":"Valjean","value":1},{"source":"Claquesous","target":"Mme.Thenardier","value":1},{"source":"Claquesous","target":"Javert","value":1},{"value":1,"target":"Eponine","source":"Claquesous"},{"source":"Claquesous","value":1,"target":"Enjolras"},{"source":"Montparnasse","target":"Javert","value":1},{"source":"Montparnasse","value":2,"target":"Babet"},{"source":"Montparnasse","value":2,"target":"Gueulemer"},{"target":"Claquesous","value":2,"source":"Montparnasse"},{"source":"Montparnasse","value":1,"target":"Valjean"},{"source":"Montparnasse","value":1,"target":"Gavroche"},{"source":"Montparnasse","value":1,"target":"Eponine"},{"source":"Montparnasse","value":1,"target":"Thenardier"},{"source":"Toussaint","target":"Cosette","value":2},{"source":"Toussaint","value":1,"target":"Javert"},{"target":"Valjean","value":1,"source":"Toussaint"},{"source":"Child1","target":"Gavroche","value":2},{"target":"Gavroche","value":2,"source":"Child2"},{"target":"Child1","value":3,"source":"Child2"},{"target":"Babet","value":3,"source":"Brujon"},{"source":"Brujon","target":"Gueulemer","value":3},{"source":"Brujon","target":"Thenardier","value":3},{"source":"Brujon","target":"Gavroche","value":1},{"source":"Brujon","value":1,"target":"Eponine"},{"source":"Brujon","target":"Claquesous","value":1},{"source":"Brujon","value":1,"target":"Montparnasse"},{"source":"Mme.Hucheloup","target":"Bossuet","value":1},{"target":"Joly","value":1,"source":"Mme.Hucheloup"},{"source":"Mme.Hucheloup","target":"Grantaire","value":1},{"source":"Mme.Hucheloup","value":1,"target":"Bahorel"},{"source":"Mme.Hucheloup","value":1,"target":"Courfeyrac"},{"source":"Mme.Hucheloup","value":1,"target":"Gavroche"},{"value":1,"target":"Enjolras","source":"Mme.Hucheloup"}],"nodes":[{"id":"Myriel","group":1},{"id":"Napoleon","group":1},{"id":"Mlle.Baptistine","group":1},{"group":1,"id":"Mme.Magloire"},{"id":"CountessdeLo","group":1},{"id":"Geborand","group":1},{"id":"Champtercier","group":1},{"id":"Cravatte","group":1},{"id":"Count","group":1},{"id":"OldMan","group":1},{"id":"Labarre","group":2},{"group":2,"id":"Valjean"},{"id":"Marguerite","group":3},{"group":2,"id":"Mme.deR"},{"group":2,"id":"Isabeau"},{"id":"Gervais","group":2},{"id":"Tholomyes","group":3},{"group":3,"id":"Listolier"},{"id":"Fameuil","group":3},{"id":"Blacheville","group":3},{"group":3,"id":"Favourite"},{"group":3,"id":"Dahlia"},{"group":3,"id":"Zephine"},{"group":3,"id":"Fantine"},{"id":"Mme.Thenardier","group":4},{"id":"Thenardier","group":4},{"id":"Cosette","group":5},{"id":"Javert","group":4},{"id":"Fauchelevent","group":0},{"group":2,"id":"Bamatabois"},{"id":"Perpetue","group":3},{"id":"Simplice","group":2},{"id":"Scaufflaire","group":2},{"id":"Woman1","group":2},{"group":2,"id":"Judge"},{"group":2,"id":"Champmathieu"},{"id":"Brevet","group":2},{"group":2,"id":"Chenildieu"},{"group":2,"id":"Cochepaille"},{"id":"Pontmercy","group":4},{"id":"Boulatruelle","group":6},{"group":4,"id":"Eponine"},{"id":"Anzelma","group":4},{"id":"Woman2","group":5},{"id":"MotherInnocent","group":0},{"group":0,"id":"Gribier"},{"group":7,"id":"Jondrette"},{"group":7,"id":"Mme.Burgon"},{"group":8,"id":"Gavroche"},{"id":"Gillenormand","group":5},{"group":5,"id":"Magnon"},{"group":5,"id":"Mlle.Gillenormand"},{"id":"Mme.Pontmercy","group":5},{"id":"Mlle.Vaubois","group":5},{"id":"Lt.Gillenormand","group":5},{"group":8,"id":"Marius"},{"id":"BaronessT","group":5},{"group":8,"id":"Mabeuf"},{"id":"Enjolras","group":8},{"id":"Combeferre","group":8},{"id":"Prouvaire","group":8},{"group":8,"id":"Feuilly"},{"id":"Courfeyrac","group":8},{"id":"Bahorel","group":8},{"group":8,"id":"Bossuet"},{"group":8,"id":"Joly"},{"group":8,"id":"Grantaire"},{"group":9,"id":"MotherPlutarch"},{"id":"Gueulemer","group":4},{"id":"Babet","group":4},{"id":"Claquesous","group":4},{"id":"Montparnasse","group":4},{"id":"Toussaint","group":5},{"id":"Child1","group":10},{"group":10,"id":"Child2"},{"group":4,"id":"Brujon"},{"id":"Mme.Hucheloup","group":8}]}`;

    const data = JSON.parse(json);
    return (
      <div className={"page-layout"} onMouseMove={this.mouseEvent} onMouseDown={this.mouseEvent}>
        <Head>
          <title>Browse</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav loading={rootStore.state.loading} />
        <Tree tree={tree} minWidth={1024} active={this.state.active} />{" "}
        {/*treeVerify={node => node.children && node.children.length} */}
        <br />
        <Graph data={data} />
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
            {/*          <img src={"/static/img/test.svg"} />
             */}
            <div id={"item-grid"} style={{ margin: "0 0" }}>
              <div className={"grid-col grid-gap-20"}>
                {items.map(item => {
                  // console.log("item: ", item);
                  const photo_id = item.photos.length > 0 ? item.photos[0].photo.id : -1;
                  const haveImage = photo_id >= 0;
                  let photo = haveImage ? item.photos[0].photo : null;
                  const path = haveImage ? `/api/image/get/${photo_id}` : "/static/img/no-image.svg";
                  const opacity = photo_id >= 0 ? 1 : 0.3;
                  if(photo !== null) photo.landscape = photo.width > photo.height;
                  //    console.log("photo: ", photo);
                  let { data, name, parent, type, children, users } = item;
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
                          // border: "1px solid black",
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

export default withSize()(Browse);
