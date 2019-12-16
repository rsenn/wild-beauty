import React, { useState } from "react";
import { Router, withRouter } from "next/router";
import Head from "next/head";
import Nav from "../components/nav.js";
import Layer from "../components/layer.js";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import { ScrollController } from "../utils/scrollController.js";
import Alea from "../utils/alea.js";
import { SwipeTracker } from "../utils/swipeTracker.js";
import { Element, Node, HSLA } from "../utils/dom.js";
import { lazyInitializer } from "../utils/lazyInitializer.js";
import { SvgOverlay } from "../utils/svg-overlay.js";
import { TouchCallback, makeTouchCallback, maxZIndex } from "../components/TouchCallback.js";
import { toJS, autorun } from "mobx";
import { inject, observer } from "mobx-react";
import { MultitouchListener, MovementListener, TouchEvents } from "../utils/touchHandler.js";
import { createStore, getOrCreateStore } from "../stores/createStore.js";
import NeedAuth from "../components/simple/needAuth.js";
import { Translate, Localize } from "react-i18nify-mobx";
import { WrapInAspectBox, SizedAspectRatioBox } from "../components/simple/aspectBox.js";
import { EditableText } from "../components/views/editableText.js";
import { AddItemBar } from "../components/views/addItemBar.js";
import classNames from "classnames";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../static/css/react-dropdown-tree-select.css";

import UploadImages from "react-upload-gallery";
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
  let obj = { label, value, expanded: true, checked: selected === value };

  if(children && children.length) obj.children = children;
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
@withRouter
class New extends React.Component {
  currentImage = null;
  clonedImage = null;
  currentOffset = { x: 0, y: 0 };
  offsetRange = 0;
  step = 1;
  state = {
    options: {}
  };

  static async getInitialProps(ctx) {
    const { RootStore } = ctx.mobxStore;

    let photos = await RootStore.fetchPhotos();
    console.log("photos:", photos);

    photos.forEach(item => RootStore.newImage(item));
  }

  constructor(props) {
    let args = [...arguments];
    const { rootStore } = props;
    //    console.log("constructor args: ", props.initialMobxState.RootStore.images);
    console.log("rootStore: ", toJS(rootStore.images));
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
      this.touchCallback = makeTouchCallback("inner-image", (event, e) => {
        const zIndex = maxZIndex() + 1;
        if(e) Element.setCSS(e, { zIndex });
        if(e && e.style) {
          const orientation = e.getAttribute("orientation");
          //   console.log("img ", { orientation });
          let offset = orientation == "landscape" ? event.x : event.y;
          if(offset > 0) offset = 0;
          if(offset < -this.offsetRange) offset = -this.offsetRange;
          if(event.type.endsWith("move")) this.currentOffset = orientation == "landscape" ? { x: offset, y: 0 } : { x: 0, y: offset };
          let transformation = orientation == "landscape" ? `translateX(${offset}px)` : `translateY(${offset}px)`;
          //   console.log("touchCallback ", { offset, transformation, range: this.offsetRange });
          //e.style.setProperty("transform", event.type.endsWith("move") ? transformation : "");
          if(event.type.endsWith("move")) e.style.setProperty("transform", transformation);
        }
      });

      this.touchListener = TouchListener(
        event => {
          //     if(event.nativeEvent) event.nativeEvent.preventDefault();
          if(event.type.endsWith("start") && event.target.tagName.toLowerCase() == "img") {
            this.currentImage = event.target;
            let obj = Element.toObject(this.currentImage);
            const orientation = this.currentImage.getAttribute("orientation");
            let rect = Element.rect(this.currentImage);
            let prect = Element.rect(this.currentImage.parentElement);
            let range = orientation == "landscape" ? rect.width - prect.width : rect.height - prect.height;
            this.offsetRange = range;
            //console.log("rect: ", { range, rect, prect });
            obj.style = `position: absolute; width: ${rect.width}px; height: ${rect.height}px`;
            if(this.clonedImage) Element.remove(this.clonedImage);
            this.clonedImage = Element.create(obj);
            document.body.appendChild(this.clonedImage);
            //console.log("clonedImage obj:", this.clonedImage);
          }

          if(event.type.endsWith("move")) {
            if(this.clonedImage && this.currentImage) {
              let zIndex = parseInt(Element.getCSS(this.currentImage, "z-index")) - 1;
              let irect = Element.rect(this.currentImage);
              //console.log("irect: ", { irect });
              if(irect.x >= 1 && irect.y >= 1) Element.move(this.clonedImage, irect);
              this.clonedImage.style.zIndex = -1;
              this.clonedImage.style.opacity = 0.5;
            }
          }

          this.touchCallback(event);

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
      MultitouchListener(
        event => {
          console.log("multitouch", event);
        },
        { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
      );
    }
    rootStore.state.step = 1;
    //    this.checkQuery();
  }

  addContent = event => {
    const { rootStore } = this.props;
    console.log("addContent: ", event);
    rootStore.fields.push({ type: null, value: "" });
  };

  checkQuery() {
    const { rootStore, router } = this.props;

    console.log("router.query", router.query);

    const obj = ["step", "image", "selected"].reduce((acc, key) => (router.query[key] !== undefined ? { ...acc, [key]: parseInt(router.query[key]) } : acc), {});
    console.log("newState: ", obj);

    rootStore.setState(obj);
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    this.checkQuery();

    rootStore.fetchItems().then(response => {
      console.log("Items: ", response.items);

      this.tree = rootStore.getItem(0, makeItemToOption());
    });
  }

  treeSelEvent = (type, arg) => {
    const { rootStore } = this.props;

    switch (type) {
      case "change": {
        console.log("treeSelEvent: ", this.tree, arg.value);
        const item = findInTree(this.tree, arg.value);
        item.checked = true;
        //rootStore.setState({ selected: arg.value });
        console.log("treeSelEvent: ", type, item);
        break;
      }
      default: {
        console.log("treeSelEvent: ", type, arg);
        break;
      }
    }
  };

  render() {
    const { rootStore, router } = this.props;
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
      document.forms[0].submit();
      console.log("onChange: ", value);
    };

    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);

    return (
      <div className={"panes-layout"} {...TouchEvents(this.touchListener)}>
        <Head>
          <title>New</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Nav />
        <div className={"page-layout"}>
          <NeedAuth>
            {rootStore.state.step == 1 ? (
              <div
                className={"upload-area"}
                style={{
                  minWidth: "80vmin"
                  // minHeight: "80vmin"
                }}
              >
                <UploadImages
                  action="/api/image/upload" // upload route
                  source={response => {
                    return response.map(item => {
                      const { id } = item;
                      const url = `/api/image/get/${id}.jpg`;
                      console.log("UploadImages response:", { item, url });
                      rootStore.newImage(item);
                      return url;
                    })[0];
                  }}
                  onSuccess={arg => {
                    const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
                    console.log("UploadImages success:", arg);

                    let entry = rootStore.newEntry(id);
                    arg.remove();

                    console.log("UploadImages success:", entry);
                  }}
                ></UploadImages>
                <div className={"image-list"}>
                  {[...rootStore.images.entries()].map(([id, image], index) => {
                    const { width, height } = image;
                    const landscape = width > height;

                    return (
                      <div className={"item-entry"}>
                        <SizedAspectRatioBox className={"item-box"}>
                          <img
                            id={`image-${id}`}
                            className={classNames(/*"inner-image", */ index == rootStore.state.selected && "selected")}
                            src={`/api/image/get/${id}.jpg`}
                            width={width}
                            height={height}
                            orientation={landscape ? "landscape" : "portrait"}
                            style={{
                              width: landscape ? `${(width * 100) / height}%` : "100%",
                              height: landscape ? "100%" : "auto"
                            }}
                            onClick={() => {
                              router.push({
                                pathname: "/new",
                                query: { step: 2, image: id, selected: index },
                                shallow: true
                              });
                              //                         rootStore.setState({ selected: index, image: id, step: 2 });
                            }}
                          />
                        </SizedAspectRatioBox>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={"content-edit"}>
                <div className={"item-photo"}>
                  <div
                    className={"item-entry"}
                    style={{
                      width: rootStore.currentImage.landscape ? `${(rootStore.currentImage.height * 100) / rootStore.currentImage.width}%` : "100%"
                    }}
                  >
                    <SizedAspectRatioBox className={"item-box"}>
                      <img
                        id={`image-${rootStore.currentImage.id}`}
                        className={"inner-image"}
                        src={`/api/image/get/${rootStore.currentImage.id}.jpg`}
                        width={rootStore.currentImage.width}
                        height={rootStore.currentImage.height}
                        orientation={rootStore.currentImage.landscape ? "landscape" : "portrait"}
                        style={{
                          width: rootStore.currentImage.landscape ? `${(rootStore.currentImage.width * 100) / rootStore.currentImage.height}%` : "100%",
                          height: rootStore.currentImage.landscape ? "100%" : "auto"
                        }}
                      />
                    </SizedAspectRatioBox>
                  </div>
                </div>
                <div></div>
                <DropdownTreeSelect
                  data={this.tree}
                  onChange={makeTreeSelEvent("change")}
                  onNodeToggle={makeTreeSelEvent("node-toggle")}
                  onFocus={makeTreeSelEvent("focus")}
                  onBlur={makeTreeSelEvent("blur")}
                  className={"dropdown-tree"}
                  mode={"radioSelect"}
                  texts={{ placeholder: "parent item" }}
                />
                {rootStore.fields.map(field => (
                  <EditableText
                    multiline={true}
                    className={"editable-text"}
                    value={field.value}
                    onValueChanged={newVal => {
                      field.value = newVal;
                    }}
                  />
                ))}
                <AddItemBar onAdd={() => rootStore.fields.push({ type: null, value: "" })} />
              </div>
            )}

            {/*            <Layer w={300} h={"300px"} margin={10} padding={20} border={"2px dashed red"} multiSelect={false} style={{ cursor: "move" }}>
              Layer
            </Layer>
            <SvgOverlay />*/}
          </NeedAuth>

          <style jsx global>{`
            .content-edit {
              width: 80vw;
              padding: 0px 20px;
              display: flex;
              flex-flow: column nowrap;
              justify-content: flex-start;
              align-items: flex-start;
            }

            button.tag-remove {
              border: 1px outset #55555580;
            }
            .editable-text {
              width: 100%;
              margin: 4px 0px;
            }
            .dropdown-tree {
            }
            .button-add:active > svg {
              transform: translate(1px, 2px);
            }
            .panes-list {
              display: flex;
              border: 1px solid black;
              position: relative;
              top: 90vh;
            }
            .panes-item {
              display: flex;
              justify-content: center;
              align-items: center;
              border: 1px dashed red;

              position: relative;
              flex: 0 0 auto;
              width: 20vw;
              height: 20vw;
              align-items: center;
              justify-content: center;
              overflow: auto;
            }
            .panes-item > img {
              width: 20vw;
            }
            div.upload-area > div,
            div.upload-area > div > div,
            div.upload-area > div > div > div {
              position: relative;
              display: block;
              width: 100%;
              height: 100%;
            }
            .item-entry {
              margin: 10px;
            }
            .item-photo {
              display: flex;
              justify-content: center;
              width: 100%;
            }
            .item-box-size {
              border: 1px solid black;
              box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.75);
              box-sizing: border-box;
            }

            .aspect-ratio-box {
              overflow: hidden;
            }
            .image-list {
              display: inline-flex;
              flex-flow: row wrap;
              flex-basis: 30%;
              justify-content: center;
            }
            .image-list > div {
              flex: 0 1 auto;
              width: 30vw;
            }
          `}</style>
        </div>
      </div>
    );
  }
}

export default New;
