import React from "react";
import { withRouter } from "next/router";
import Head from "next/head";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../utils/alea.js";
import { Element, HSLA } from "../utils/dom.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { makeTouchCallback, maxZIndex } from "../components/TouchCallback.js";
import { toJS, action, set } from "mobx";
import { inject, observer } from "mobx-react";
import { MultitouchListener, MovementListener, TouchListener } from "../utils/touchHandler.js";
import { getOrCreateStore } from "../stores/createStore.js";
import { ImageUpload } from "../components/views/imageUpload.js";
import { ItemEditor } from "../components/views/itemEditor.js";
import { WithQueryParam, IfQueryParam } from "../components/withQueryParam.js";
import { trkl } from "../utils/trkl.js";
import NeedAuth from "../components/simple/needAuth.js";
import { BehaveHooks, Behave } from "../utils/behave.js";

import "../static/css/react-upload-gallery.css";

import "../static/style.css";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

const makeItemToOption = selected => item => {
  let data = (item && item.data) || {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label, title: label, value, expanded: true, checked: selected === value };

  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  if(!data.name) if (!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;

  return obj;
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

@inject("rootStore")
@observer
//@withRouter
class New extends React.Component {
  currentImage = null;
  clonedImage = null;
  currentOffset = { x: 0, y: 0 };
  offsetRange = 0;
  step = 1;
  state = {
    options: {}
  };
  svgLayer = trkl();

  /**
   * Gets the initial properties.
   *
   * @param      {<type>}   ctx     The context
   * @return     {Promise}  The initial properties.
   */
  static async getInitialProps({ res, req, err, mobxStore, ...ctx }) {
    const { RootStore } = mobxStore;
    let images = [];

    if(!global.window) {
      images = await RootStore.fetchImages(/*{ where: { user_id:   }}*/);

      images = images.filter(ph => ph.items.length == 0);
      images.forEach(item => RootStore.newImage(item));

      const { url, query, body, route } = req || {};
      /*
    const ctxKeys = Object.keys(ctx);
    const reqKeys = Object.keys(req);
*/
      //console.log("New.getInitialProps", { ctx,  url,  query, body });
      console.log("New.getInitialProps", { images });

      if(ctx && req && req.cookies) {
        const { token, user_id } = req.cookies;
        //set(RootStore.auth, { token, user_id });
        RootStore.auth.token = token;
        RootStore.auth.user_id = user_id;
      }
    }

    return { images };
  }

  /**
   * Constructs a new instance.
   *
   * @param      {<type>}  props   The properties
   */
  constructor(props) {
    let args = [...arguments];
    const { rootStore } = props;
    //console.log("constructor args: ", props.initialMobxState.RootStore.images);
    super(props);

    if(global.window) {
      window.page = this;
      window.rs = rootStore;
      //    window.stores = getOrCreateStore();
    }

    let swipeEvents = {};
    var e = null;

    if(global.window !== undefined) {
      window.page = this;
      window.rs = rootStore;
    }

    if(global.window) {
      const moveImage = (event, e) => {
        const orientation = e.getAttribute("orientation");
        //console.log("img ", { orientation });
        let offset = orientation == "landscape" ? event.x : event.y;
        if(offset > 0) offset = 0;
        if(offset < -this.offsetRange) offset = -this.offsetRange;
        if(event.type.endsWith("move"))
          this.currentOffset = orientation == "landscape" ? { x: offset, y: 0 } : { x: 0, y: offset };
        let transformation = orientation == "landscape" ? `translateX(${offset}px)` : `translateY(${offset}px)`;
        //   console.log("touchCallback ", { offset, transformation, range: this.offsetRange });

        //e.style.setProperty("transform", event.type.endsWith("move") ? transformation : "");

        if(event.type.endsWith("move")) {
          e.style.setProperty("transform", transformation);
          this.clonedImage.style.setProperty("transform", transformation);
        }
      };
      this.touchCallback = makeTouchCallback("inner-image", (event, e) => {
        //    console.log("touchCallback ", { event, e });

        const zIndex = maxZIndex() + 1;
        if(e) Element.setCSS(e, { zIndex });
        if(e && e.style) {
          moveImage(event, e);
        }
      });

      this.touchListener = TouchListener(
        event => {
          console.log("Touch ", event);
          const elem = event.target;

          //     if(event.nativeEvent) event.nativeEvent.preventDefault();
          if(
            event.type.endsWith("start") &&
            event.target.tagName.toLowerCase() == "img" &&
            elem.classList.contains("inner-image")
          ) {
            this.currentImage = event.target;
            let obj = Element.toObject(this.currentImage);
            const orientation = this.currentImage.getAttribute("orientation");
            let rect = Element.rect(this.currentImage);
            let prect = Element.rect(this.currentImage.parentElement.parentElement);
            let range = orientation == "landscape" ? rect.width - prect.width : rect.height - prect.height;
            this.offsetRange = range;
            console.log("rect: ", { orientation, range, rect, prect });
            obj.style = `position: fixed; top: ${rect.y - window.scrollY}px; left: ${rect.x}px; width: ${
              rect.width
            }px; height: ${rect.height}px`;
            if(this.clonedImage) Element.remove(this.clonedImage);
            this.clonedImage = Element.create(obj);
            document.body.appendChild(this.clonedImage);

            this.clonedImage.style.zIndex = -1;
            this.clonedImage.style.opacity = 0.3;
            //   Element.move(this.clonedImage, rect);
            //console.log("clonedImage obj:", this.clonedImage);
          }

          if(event.type.endsWith("move")) {
            if(this.clonedImage && this.currentImage) {
              let zIndex = parseInt(Element.getCSS(this.currentImage, "z-index")) - 1;
              let irect = Element.rect(this.currentImage);

              //console.log("irect: ", { irect });
              //  if(irect.x >= 1 && irect.y >= 1) Element.move(this.clonedImage, irect);
              //

              moveImage(event, this.currentImage);
            }
          }
          /* console.log("Touch obj:", this.touchCallback);

          this.touchCallback(event, this.currentImage);
*/
          if(event.type.endsWith("end")) {
            if(this.clonedImage && this.currentImage) {
              this.currentImage.style.position = "relative";
              /*           this.currentImage.style.left = `${this.currentOffset.x}px`;
           this.currentImage.style.top = `${this.currentOffset.y}px`;*/

              console.log("currentOffset: ", this.currentOffset);
              console.log("currentImage: ", this.currentImage);
              Element.remove(this.clonedImage);
              this.clonedImage = null;
            }
          }
        },
        {
          element: global.window,
          step: 1,
          round: true,
          listener: MovementListener,
          noscroll: true
        }
      );
      window.dragged = e;
      /*   MultitouchListener(
        event => {
          console.log("multitouch", event);
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );*/
    }
    rootStore.state.step = 1;
    //    this.checkQuery();
  }

  /**
   * Adds content.
   *
   * @param      {<type>}  event   The event
   */
  @action.bound
  addContent(event) {
    const { rootStore } = this.props;
    console.log("addContent: ", event);
    rootStore.fields.push({ type: null, value: "" });
  }

  @action.bound
  checkQuery() {
    const { rootStore, router } = this.props;
    console.log("router.query", router.query);
    const obj = ["step", "image", "selected"].reduce(
      (acc, key) => (router.query[key] !== undefined ? { ...acc, [key]: parseInt(router.query[key]) } : acc),
      {}
    );
    console.log("newState: ", obj);
    rootStore.setState(obj);
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    //this.checkQuery();
    rootStore.loadItems().then(response => {
      if(response) {
        console.log("Items: ", response.items);
        this.tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());
        console.log("this.tree", toJS(this.tree));
      }
    });

    let textEditor = Element.findAll("textarea");

    textEditor.forEach(e => {
      console.log("behaveTextarea: ", e);
      behaveTextarea(e);
    });
  }

  /**
   * Choose image for new item }
   *
   * @param      {<type>}  event   The event
   */
  @action.bound
  chooseImage(event) {
    const { rootStore, router } = this.props;
    const { target, currentTarget } = event;
    let id = parseInt(target.getAttribute("id").replace(/.*-/g, ""));
    console.log("New.chooseImage ", { id, target, currentTarget });

    rootStore.state.image = id;
    rootStore.state.step = 2;

    router.push("/edit", `/edit/${id}`);

    //  router.push('/new', `/new?act=edit&img=${id}`, { /*query: { act: 'edit', img: id }, */shallow: true });
  }

  /*  @action.bound
  deleteImage(id) {
    const { rootStore } = this.props;

    rootStore.deleteImage()

  }
*/
  render() {
    const { rootStore } = this.props;
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      console.log("onChange: ", value);
    };
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);

    console.log("New.render", this.tree);

    return (
      <div className={"page-layout"}>
        <Head>
          <title>New</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav>
          {global.window ? window.site.label(this.props) : undefined} -{" "}
          {global.window ? window.site.description(this.props) : undefined}
        </Nav>
        <div className={"content-layout"}>
          <NeedAuth>
            {rootStore.state.image === null ? (
              <ImageUpload images={this.props.images} onChoose={this.chooseImage} onDelete={rootStore.deleteImage} />
            ) : (
              <ItemEditor tree={this.tree} makeTreeSelEvent={makeTreeSelEvent} />
            )}
            {/*
          <IfQueryParam act={false}>
          <ImageUpload onChoose={this.chooseImage} onDelete={rootStore.deleteImage} />
          </IfQueryParam>
          <IfQueryParam act={'edit'} img={true}>
          <ItemEditor tree={this.tree} makeTreeSelEvent={makeTreeSelEvent} />
          </IfQueryParam>*/}
            {/*            <Layer w={300} h={"300px"} margin={10} padding={20} border={"2px dashed red"} multiSelect={false} style={{ cursor: "move" }}>
              Layer
            </Layer>*/}
          </NeedAuth>
          <SvgOverlay svgRef={this.svgLayer} />
          <style jsx global>{`
            button.tag-remove {
              border: 1px outset #55555580;
            }
            .dropdown-tree {
            }
            .content-layout {
              width: 100vw;
              text-align: left;
            }
          `}</style>
        </div>
      </div>
    );
  }
}

export default New;
