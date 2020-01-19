import React from "react";
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
import { getOrCreateStore } from "../stores/createStore.js";
import affineFit from "affinefit";
import { fromTriangles } from "transformation-matrix";
import { MovementListener, TouchListener } from "../utils/touchHandler.js";
import { trkl } from "../utils/trkl.js";
import Layout from "../components/layout.js";

import "../static/css/grid.css";

import "../static/css/react-dropdown-tree-select.css";
import { withSize } from "react-sizeme";

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

@inject("rootStore")
@observer
class List extends React.Component {
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
    console.log("List.getInitialProps ", [...arguments]);
  }

  constructor(props) {
    super(props);

    const { rootStore } = this.props;

    this.api = getAPI(
      global.window && /192\.168/.test(window.location.href)
        ? "http://wild-beauty.herokuapp.com/v1/graphql"
        : "/v1/graphql"
    );
    if(global.window) {
      window.api = this.api;
      window.page = this;
      window.rs = rootStore;
      window.stores = getOrCreateStore();

      //   window.addEventListener('mousemove', this.mouseMove);
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

    rootStore.loadItems().then(response => {
      if(response) {
        console.log("Items: ", response.items);

        this.tree = rootStore.getHierarchy(undefined, it => {
      if(!it.children) it.size = 10;
      it.value = it.id;
      return it;
    });
        console.log("this.tree", toJS(this.tree));
      }
    });
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
    let tree = this.tree;
    const items = this.props.items
      ? this.props.items.filter(item => this.state.parentIds.indexOf(item.parent_id) != -1)
      : [];

//const collapsibleForceLayoutData =  {  name: "flare", children: [{name: "animate", children: [{ name: "Easing", size: 17010 }, { name: "FunctionSequence", size: 5842 }, {name: "interpolate", children: [{ name: "ArrayInterpolator", size: 1983 }, { name: "ColorInterpolator", size: 2047 }, { name: "DateInterpolator", size: 1375 }, { name: "Interpolator", size: 8746 }, { name: "MatrixInterpolator", size: 2202 }, { name: "NumberInterpolator", size: 1382 }, { name: "ObjectInterpolator", size: 1629 }, { name: "PointInterpolator", size: 1675 }, { name: "RectangleInterpolator", size: 2042 } ] }, { name: "ISchedulable", size: 1041 }, { name: "Parallel", size: 5176 }, { name: "Pause", size: 449 }, { name: "Scheduler", size: 5593 }, { name: "Sequence", size: 5534 }, { name: "Transition", size: 9201 }, { name: "Transitioner", size: 19975 }, { name: "TransitionEvent", size: 1116 }, { name: "Tween", size: 6006 } ] }, {name: "physics", children: [{ name: "DragForce", size: 1082 }, { name: "GravityForce", size: 1336 }, { name: "IForce", size: 319 }, { name: "NBodyForce", size: 10498 }, { name: "Particle", size: 2822 }, { name: "Simulation", size: 9983 }, { name: "Spring", size: 2213 }, { name: "SpringForce", size: 1681 } ] }, {name: "query", children: [{ name: "AggregateExpression", size: 1616 }, { name: "And", size: 1027 }, { name: "Arithmetic", size: 3891 }, { name: "Average", size: 891 }, { name: "BinaryExpression", size: 2893 }, { name: "Comparison", size: 5103 }, { name: "CompositeExpression", size: 3677 }, { name: "Count", size: 781 }, { name: "DateUtil", size: 4141 }, { name: "Distinct", size: 933 }, { name: "Expression", size: 5130 }, { name: "ExpressionIterator", size: 3617 }, {name: "methods", children: [{ name: "add", size: 593 }, { name: "and", size: 330 }, { name: "average", size: 287 }, { name: "count", size: 277 }, { name: "distinct", size: 292 }, { name: "div", size: 595 }, { name: "eq", size: 594 }, { name: "fn", size: 460 }, { name: "gt", size: 603 }, { name: "gte", size: 625 }, { name: "iff", size: 748 }, { name: "isa", size: 461 }, { name: "lt", size: 597 }, { name: "lte", size: 619 }, { name: "max", size: 283 }, { name: "min", size: 283 }, { name: "mod", size: 591 }, { name: "mul", size: 603 }, { name: "neq", size: 599 }, { name: "not", size: 386 }, { name: "or", size: 323 }, { name: "orderby", size: 307 }, { name: "range", size: 772 }, { name: "select", size: 296 }, { name: "stddev", size: 363 }, { name: "sub", size: 600 }, { name: "sum", size: 280 }, { name: "update", size: 307 }, { name: "variance", size: 335 }, { name: "where", size: 299 }, { name: "xor", size: 354 }, { name: "_", size: 264 } ] }, { name: "Minimum", size: 843 }, { name: "Not", size: 1554 }, { name: "Or", size: 970 }, { name: "Query", size: 13896 }, { name: "Range", size: 1594 }, { name: "StringUtil", size: 4130 }, { name: "Sum", size: 791 }, { name: "Variable", size: 1124 }, { name: "Variance", size: 1876 }, { name: "Xor", size: 1101 } ] }, {name: "scale", children: [{ name: "IScaleMap", size: 2105 }, { name: "LinearScale", size: 1316 }, { name: "LogScale", size: 3151 }, { name: "OrdinalScale", size: 3770 }, { name: "QuantileScale", size: 2435 }, { name: "QuantitativeScale", size: 4839 }, { name: "RootScale", size: 1756 }, { name: "Scale", size: 4268 }, { name: "ScaleType", size: 1821 }, { name: "TimeScale", size: 5833 } ] }, {name: "vis", children: [{name: "axis", children: [{ name: "Axes", size: 1302 }, { name: "Axis", size: 24593 }, { name: "AxisGridLine", size: 652 }, { name: "AxisLabel", size: 636 }, { name: "CartesianAxes", size: 6703 } ] }, {name: "controls", children: [{ name: "AnchorControl", size: 2138 }, { name: "ClickControl", size: 3824 }, { name: "Control", size: 1353 }, { name: "ControlList", size: 4665 }, { name: "DragControl", size: 2649 }, { name: "ExpandControl", size: 2832 }, { name: "HoverControl", size: 4896 }, { name: "IControl", size: 763 }, { name: "PanZoomControl", size: 5222 }, { name: "SelectionControl", size: 7862 }, { name: "TooltipControl", size: 8435 } ] }, {name: "data", children: [{ name: "Data", size: 20544 }, { name: "DataList", size: 19788 }, { name: "DataSprite", size: 10349 }, { name: "EdgeSprite", size: 3301 }, { name: "NodeSprite", size: 19382 }, {name: "render", children: [{ name: "ArrowType", size: 698 }, { name: "EdgeRenderer", size: 5569 }, { name: "IRenderer", size: 353 }, { name: "ShapeRenderer", size: 2247 } ] }, { name: "ScaleBinding", size: 11275 }, { name: "Tree", size: 7147 }, { name: "TreeBuilder", size: 9930 } ] }, {name: "events", children: [{ name: "DataEvent", size: 2313 }, { name: "SelectionEvent", size: 1880 }, { name: "TooltipEvent", size: 1701 }, { name: "VisualizationEvent", size: 1117 } ] }, {name: "legend", children: [{ name: "Legend", size: 20859 }, { name: "LegendItem", size: 4614 }, { name: "LegendRange", size: 10530 } ] }, {name: "operator", children: [{name: "distortion", children: [{ name: "BifocalDistortion", size: 4461 }, { name: "Distortion", size: 6314 }, { name: "FisheyeDistortion", size: 3444 } ] }, {name: "encoder", children: [{ name: "ColorEncoder", size: 3179 }, { name: "Encoder", size: 4060 }, { name: "PropertyEncoder", size: 4138 }, { name: "ShapeEncoder", size: 1690 }, { name: "SizeEncoder", size: 1830 } ] }, {name: "filter", children: [{ name: "FisheyeTreeFilter", size: 5219 }, { name: "GraphDistanceFilter", size: 3165 }, { name: "VisibilityFilter", size: 3509 } ] }, { name: "IOperator", size: 1286 }, {name: "label", children: [{ name: "Labeler", size: 9956 }, { name: "RadialLabeler", size: 3899 }, { name: "StackedAreaLabeler", size: 3202 } ] }, {name: "layout", children: [{ name: "AxisLayout", size: 6725 }, { name: "BundledEdgeRouter", size: 3727 }, { name: "CircleLayout", size: 9317 }, { name: "CirclePackingLayout", size: 12003 }, { name: "DendrogramLayout", size: 4853 }, { name: "ForceDirectedLayout", size: 8411 }, { name: "IcicleTreeLayout", size: 4864 }, { name: "IndentedTreeLayout", size: 3174 }, { name: "Layout", size: 7881 }, { name: "NodeLinkTreeLayout", size: 12870 }, { name: "PieLayout", size: 2728 }, { name: "RadialTreeLayout", size: 12348 }, { name: "RandomLayout", size: 870 }, { name: "StackedAreaLayout", size: 9121 }, { name: "TreeMapLayout", size: 9191 } ] }, { name: "Operator", size: 2490 }, { name: "OperatorList", size: 5248 }, { name: "OperatorSequence", size: 4190 }, { name: "OperatorSwitch", size: 2581 }, { name: "SortOperator", size: 2023 } ] }, { name: "Visualization", size: 16540 } ] } ] };

    console.log("List.render ", { tree });
    return (
      <Layout>
        {/*<Tree tree={tree} minWidth={1024} active={this.state.active} />*/}
        {/*treeVerify={node => node.children && node.children.length} */}
        <br />
        <Graph data={tree  } />
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
                  const path = haveImage ? `/api/image/get/${photo_id}` : "/static/img/no-image.svg";
                  const opacity = photo_id >= 0 ? 1 : 0.3;
                  if(photo !== null) photo.landscape = photo.width > photo.height;
                  //console.log("photo: ", photo);
                  let { data, name, parent, type, children, users } = item;
                  try {
                    data = item.data && item.data.length && JSON.parse(item.data);
                  } catch(err) {
                    data = item.data;
                  }
                  if(typeof data != "object" || data === null) data = {};
                  //console.log("data: ", data);
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
      </Layout>
    );
  }
}

export default withSize()(List);
