import React from "react";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../utils/alea.js";
import { Element } from "../utils/dom.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { makeTouchCallback } from "../components/TouchCallback.js";
import { action } from "mobx";
import { inject, observer } from "mobx-react";
import { MovementListener, TouchListener } from "../utils/touchHandler.js";
import { ImageUpload } from "../components/views/imageUpload.js";
import { ItemEditor } from "../components/views/itemEditor.js";
import { trkl } from "../utils/trkl.js";
import NeedAuth from "../components/simple/needAuth.js";
import Layout from "../components/layout.js";
import { maxZIndex } from "../stores/functions.js";

import "../static/css/react-upload-gallery.css";
import "../static/style.css";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

@inject("rootStore")
@observer
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

  static async getInitialProps({ res, req, err, mobxStore, ...ctx }) {
    const { RootStore } = mobxStore;
    let images = [];
    if(!global.window) {
      images = await RootStore.fetchImages();
      images = images.filter(ph => ph.items.length == 0);
      images.forEach(item => RootStore.newImage(item));
      const { url, query, body, route } = req || {};
      //console.log("New.getInitialProps", { images });
      if(ctx && req && req.cookies) {
        const { token, user_id } = req.cookies;
        RootStore.auth.token = token;
        RootStore.auth.user_id = user_id;
      }
    }
    return { images };
  }

  constructor(props) {
    let args = [...arguments];
    const { rootStore } = props;
    super(props);
    if(global.window) {
      window.page = this;
      window.rs = rootStore;
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
        let offset = orientation == "landscape" ? event.x : event.y;
        if(offset > 0) offset = 0;
        if(offset < -this.offsetRange) offset = -this.offsetRange;
        if(event.type.endsWith("move")) this.currentOffset = orientation == "landscape" ? { x: offset, y: 0 } : { x: 0, y: offset };
        let transformation = orientation == "landscape" ? `translateX(${offset}px)` : `translateY(${offset}px)`;
        if(event.type.endsWith("move")) {
          e.style.setProperty("transform", transformation);
          this.clonedImage.style.setProperty("transform", transformation);
        }
      };
      this.touchCallback = makeTouchCallback("inner-image", (event, e) => {
        const zIndex = maxZIndex() + 1;
        if(e) Element.setCSS(e, { zIndex });
        if(e && e.style) {
          moveImage(event, e);
        }
      });
      this.touchListener = TouchListener(
        event => {
          //console.log("Touch ", event);
          const elem = event.target;
          if(event.type.endsWith("start") && event.target.tagName.toLowerCase() == "img" && elem.classList.contains("inner-image")) {
            this.currentImage = event.target;
            let obj = Element.toObject(this.currentImage);
            const orientation = this.currentImage.getAttribute("orientation");
            let rect = Element.rect(this.currentImage);
            let prect = Element.rect(this.currentImage.parentElement.parentElement);
            let range = orientation == "landscape" ? rect.width - prect.width : rect.height - prect.height;
            this.offsetRange = range;
            //console.log("rect: ", { orientation, range, rect, prect });
            obj.style = `position: fixed; top: ${rect.y - window.scrollY}px; left: ${rect.x}px; width: ${rect.width}px; height: ${rect.height}px`;
            if(this.clonedImage) Element.remove(this.clonedImage);
            this.clonedImage = Element.create(obj);
            document.body.appendChild(this.clonedImage);
            this.clonedImage.style.zIndex = -1;
            this.clonedImage.style.opacity = 0.3;
          }
          if(event.type.endsWith("move")) {
            if(this.clonedImage && this.currentImage) {
              let zIndex = parseInt(Element.getCSS(this.currentImage, "z-index")) - 1;
              let irect = Element.rect(this.currentImage);
              moveImage(event, this.currentImage);
            }
          }
          if(event.type.endsWith("end")) {
            if(this.clonedImage && this.currentImage) {
              this.currentImage.style.position = "relative";
              //console.log("currentOffset: ", this.currentOffset);
              //console.log("currentImage: ", this.currentImage);
              Element.remove(this.clonedImage);
              this.clonedImage = null;
            }
          }
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );
    }
    rootStore.state.step = 1;
  }

  @action.bound
  addContent(event) {
    const { rootStore } = this.props;
    //console.log("addContent: ", event);
    rootStore.fields.push({ type: null, value: "" });
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
  }

  @action.bound
  chooseImage(event) {
    const { rootStore, router } = this.props;
    const { target, currentTarget } = event;
    let photo_id = parseInt(target.getAttribute("id").replace(/.*-/g, ""));
    //console.log("New.chooseImage ", { photo_id, target, currentTarget });
    rootStore.state.image = photo_id;
    rootStore.state.step = 2;
    router.push("/new", `/new/${photo_id}`);
  }

  handleClick = event => {
    //console.log("New handleClick ", event);
  };

  render() {
    const { rootStore } = this.props;
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      //console.log("onChange: ", value);
    };
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);
    //console.log("New.render", this.tree);
    return (
      <Layout toastsClick={this.handleClick}>
        <NeedAuth>
          {rootStore.state.image === null ? (
            <ImageUpload images={this.props.images} onChoose={this.chooseImage} onDelete={rootStore.deleteImage} />
          ) : (
            <ItemEditor tree={this.tree} makeTreeSelEvent={makeTreeSelEvent} />
          )}
          {}
          {}
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
      </Layout>
    );
  }
}

export default New;
