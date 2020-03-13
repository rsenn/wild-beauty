import React from "react";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../lib/alea.js";
import { lazyInitializer } from "../lib/lazyInitializer.js";
import { SvgOverlay } from "../lib/svg-overlay.js";
import { action } from "mobx";
import { inject, observer } from "mobx-react";
import { ImageUpload, hvOffset } from "../components/views/imageUpload.js";
import { ItemEditor } from "../components/views/itemEditor.js";
import { trkl } from "../lib/trkl.js";
import NeedAuth from "../components/simple/needAuth.js";
import Layout from "../components/layout.js";
import { SelectionListener } from "../lib/touchHandler.js";
import { Element } from "../lib/dom.js";

/*import "../static/css/react-upload-gallery.css";
import "../static/style.css";*/

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
  shiftState = trkl(false);

  static async getInitialProps({ res, req, err, mobxStore, ...ctx }) {
    const { RootStore } = mobxStore;
    let token, user_id;
    let images = [];
    if(ctx && req && req.cookies) {
      token = req.cookies.token;
      user_id = req.cookies.user_id;
      RootStore.auth.token = token;
      RootStore.auth.user_id = user_id;
    }
    if(!global.window) {
      if(user_id) {
        images = await RootStore.fetchImages({ user_id });
        images = images.filter(ph => ph.items.length == 0);
        images.forEach(item => RootStore.newImage(item));
      }
      const { url, query, body, route } = req || {};
      console.log("New.getInitialProps", { url });
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

      window.addEventListener("keydown", event => (event.key == "Shift" ? this.shiftState(true) : undefined));
      window.addEventListener("keyup", event => (event.key == "Shift" ? this.shiftState(false) : undefined));
      window.addEventListener("click", this.handleClick);
    }
    this.touchListener = SelectionListener(event => {}, { color: "#40ff00", shadow: "#000000" });
    rootStore.state.step = 1;

    //  this.shiftState.subscribe(this.handleShiftState);
  }

  @action.bound
  addContent(event) {
    const { rootStore } = this.props;
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
    router.push(`/new/${photo_id}`);
  }

  handleClick = event => {
    const nativeEvent = event.nativeEvent || event;
    const shiftState = this.shiftState();
    console.log("New.ĥandleClick", { shiftState });
  };
  /*
  handleKeyDown = event => {
    const nativeEvent = event.nativeEvent || event;
    if(nativeEvent.key == "Shift") this.shiftState(true);
  };

  handleKeyUp = event => {
    const nativeEvent = event.nativeEvent || event;
    if(nativeEvent.key == "Shift") this.shiftState(false);
  };
*/
  handleShiftState = state => {
    console.log("New.handleShiftState", state);
  };

  render() {
    const { rootStore } = this.props;
    const onError = event => {};
    const onImage = event => {
      const { value } = event.nativeEvent.target;
    };
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);
    return (
      <Layout scroll={false} toastsClick={this.handleClick} className={"noselect"} {...this.touchListener.events}>
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp}>
          <NeedAuth>
            {rootStore.state.image === null ? (
              <ImageUpload
                shiftState={this.shiftState}
                images={this.props.images}
                onChoose={this.chooseImage}
                onDelete={id => {
                  let e = Element.find(`#image-${id}`);
                  do {
                    if(e.parentElement == null) break;
                    e = e.parentElement;
                  } while(!e.classList || !(e.classList.contains("image-entry") || e.classList.contains("rug-item")));
                  rootStore.deleteImage(id, result => {
                    Element.remove(e.parentElement);
                  });
                }}
                onRotate={(id, angle = 90) => {
                  let img = Element.find(`#image-${id}`);
                  console.log("onRotate: ", { id, img });
                  let e = img;
                  do {
                    if(e.parentElement == null) break;
                    e = e.parentElement;
                  } while(!e.classList || !e.classList.contains("image-entry"));

                  let src = img.getAttribute("src");

                  Element.attr(img, { src: "" });

                  rootStore.rotateImage(id, angle, ({ success, width, height }) => {
                    const landscape = width > height;
                    const aspect = width / height;
                    const orientation = landscape ? "landscape" : "portrait";

                    let { w, h, hr, vr } = hvOffset(width, height);

                    console.log("rotateImage result:", { success, width, height, w, h, hr, vr });
                    src = src.replace(/\?.*/g, "") + "?ts=" + Util.unixTime();

                    Element.attr(img, { src, width, height, style: `position: relative; width: ${w}%; height: ${h}%; margin-top: ${-vr / 2}%; margin-left: ${-hr / 2}%;` });
                    Element.attr(e, { ["data-tooltip"]: `${width}x${height} ${orientation}` });
                  });
                }}
              />
            ) : (
              <ItemEditor tree={this.tree} makeTreeSelEvent={makeTreeSelEvent} />
            )}
          </NeedAuth>
        </div>
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
          .rug {
            font-size: 14px;
            color: black;
            min-width: 80vw;
          }

          .rug .rug-file-input {
            display: none !important;
          }
          .rug .rug-item {
            justify-content: center;
            user-select: none;
            cursor: default;
          }
          .rug .rug-items.__card {
            display: flex;
            flex-flow: row wrap;
            margin: 0 -10px 0 -10px;
          }
          @media (max-width: 450px) {
            .rug .rug-items.__card {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
          }
          .rug .rug-items.__card .rug-item {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .rug .rug-items.__list {
            padding-top: 30px;
            min-height: 220px;
          }
          .rug .rug-handle {
            width: 100%;
            height: 290px;
            overflow: hidden;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
          }
          .rug .rug-handle:before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: calc(100% - 8px);
            height: calc(100% - 8px);

            border: 4px solid black;
          }
          .rug .rug-handle svg.rug-handle-icon {
            width: 70px;
          }
          .rug .rug-handle svg.rug-handle-icon polyline,
          .rug .rug-handle svg.rug-handle-icon line {
            fill: none;
            stroke: black;
            stroke-linejoin: round;
            stroke-width: 2px;
            stroke-linecap: round;
          }
          .rug .rug-handle.__dragging:before {
            border: 4px dashed rgba(138, 0, 16, 0.8);
            background-color: rgba(0, 122, 255, 0.15);
          }
          .rug .rug-handle.__dragging svg polyline,
          .rug .rug-handle.__dragging svg line {
            stroke: rgba(138, 0, 16, 0.8);
          }
          .rug .rug-handle.__dragging .__arrow {
            animation: 1s up-arrow forwards infinite;
          }
          .rug .rug-handle .rug-handle-info {
            position: relative;
          }
          .rug .rug-handle .rug-handle-info .rug-handle-drop-text {
            font-size: 22px;
          }
          .rug .rug-handle .rug-handle-info .rug-handle-button {
            background-color: rgba(138, 0, 16, 0.8);

            padding: 7px 12px;
            font-size: 16px;
            color: white;
            text-align: center;

            max-width: 250px;
            display: block;
            margin: 0 auto;
          }
          .rug .rug-handle .rug-handle-info .rug-handle-button:hover {
            background-color: rgba(192, 8, 32, 0.8);
          }
          .rug .rug-handle .rug-handle-info span {
            text-align: center;
            padding: 10px 0;
            font-size: 17px;
            display: block;
          }

          @keyframes up-arrow {
            0%,
            50% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          @media (max-width: 960px) {
            .rug .rug-handle {
              height: 170px;
            }
            .rug .rug-handle svg {
              width: 50px;
            }
            .rug .rug-handle .rug-handle-drop-text,
            .rug .rug-handle span {
              display: none !important;
            }
          }

          .rug-card {
            flex: 1 1 20%;
            width: 18vw;

            background-color: black;

            position: relative;
            font-family: Fixed;
            overflow: auto;

            margin: 10px;
          }
          /*@media (max-width: 450px) {
  .rug-card {
    width: 160px;
    height: 160px;
  }
}*/
          .rug-card.__error {
            border: 3px solid rgba(160, 0, 16, 1);
          }
          .rug-card .rug-card-image {
            width: 100%;
            padding-top: 100%;
            background-position: 50%;
            background-size: contain;
            background-repeat: no-repeat;
          }
          .rug-card .rug-card-name {
            position: absolute;
            z-index: 15;
            height: 100px;
            width: 100%;
            font-weight: 700;
            font-size: 12px;
            white-space: nowrap;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0, rgba(0, 0, 0, 0.7) 29%, transparent);
            background-blend-mode: multiply;
            color: #f5f5f5;
          }
          .rug-card .rug-card-name > div {
            margin: 10px;
            overflow: hidden;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .rug-card .rug-card-size {
            color: #c3c3c3;
            font-size: 11px;
          }
          .rug-card .rug-card-progress {
            position: absolute;
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;
            display: block;
          }
          .rug-card .rug-card-progress .__progress-cricle {
            stroke: #007aff;
            fill: none;
            stroke-width: 5;
            stroke-linecap: round;
            transition: stroke-dasharray 200ms ease;
          }
          .rug-card .rug-card-progress-count {
            position: absolute;
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;
            text-align: center;
            line-height: 50px;
            color: white;
            font-weight: bold;
          }
          .rug-card .rug-card-refresh {
            position: absolute;
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;

            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            border: 2px solid transparent;
          }
          .rug-card .rug-card-refresh:hover {
            background-color: rgba(255, 255, 255, 0.9);
            border: 2px solid black;
          }
          .rug-card .rug-card-refresh .__refresh-icon g {
            fill: #3d4852;
          }
          .rug-card .rug-card-refresh.__spin {
            animation: __spin 1000ms linear infinite;
            border: 2px solid #007aff !important;
          }
          .rug-card .rug-card-refresh.__spin .__refresh-icon g {
            fill: #007aff;
          }
          .rug-card .rug-card-upload-button {
            position: absolute;
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;

            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            text-align: center;
            border: 2px solid transparent;
          }
          .rug-card .rug-card-upload-button svg {
            width: 25px;
            margin-top: 6px;
          }
          .rug-card .rug-card-upload-button svg polyline,
          .rug-card .rug-card-upload-button svg line {
            fill: none;
            stroke: black;
            stroke-linejoin: round;
            stroke-width: 3px;
            stroke-linecap: round;
          }
          .rug-card .rug-card-upload-button:hover {
            border: 2px solid rgba(138, 0, 16, 0.8);
            background-color: rgba(255, 255, 255, 0.9);
          }
          .rug-card .rug-card-upload-button:hover svg polyline,
          .rug-card .rug-card-upload-button:hover svg line {
            stroke: rgba(138, 0, 16, 0.8);
          }
          .rug-card .rug-card-upload-button:hover svg .__arrow {
            animation: 1s up-arrow forwards infinite;
          }
          .rug-card .rug-card-remove {
            position: absolute;
            z-index: 40;
            bottom: 0;
            right: 0;
            color: white;
            background-color: black;
            opacity: 0.75;
            border-radius: 9999px;
            margin: 4px;
            padding: 4px;
            width: 22px;
            height: 22px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1.5px solid transparent;
            transition: border 200ms ease;
          }
          .rug-card .rug-card-remove:hover {
            border: 1.5px solid #fff;
          }
          .rug-card .rug-card-remove svg {
            stroke: currentColor;
            height: 18px;
            width: 18px;
          }

          @keyframes __spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .rug-list {
            width: 100%;
            background-color: black;
            border-radius: 3px;
            position: relative;
            font-family: Helvetica;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            margin-bottom: 10px;
          }
          .rug-list.__error {
            border: 3px solid rgba(160, 0, 16, 1);
          }
          .rug-list .rug-list-progress {
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 5px;
            background: rgba(138, 0, 16, 0.8);
            border: 3px;
            opacity: 0;
            transition: all 200ms ease;
          }
          .rug-list .rug-list-progress.__active {
            opacity: 1;
          }
          .rug-list .rug-list-progress-count {
            position: absolute;
            bottom: 5px;
            right: 5px;
            color: #f5f5f5;
            font-size: 13px;
            opacity: 0;
            transition: all 200ms ease;
          }
          .rug-list .rug-list-progress-count.__active {
            opacity: 1;
          }
          .rug-list .rug-list-refresh {
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            border: 2px solid transparent;
          }
          .rug-list .rug-list-refresh:hover {
            background-color: rgba(255, 255, 255, 0.9);
          }
          .rug-list .rug-list-refresh .__refresh-icon g {
            fill: #3d4852;
          }
          .rug-list .rug-list-refresh.__spin {
            animation: __spin 1000ms linear infinite;
          }
          .rug-list .rug-list-refresh.__spin .__refresh-icon g {
            fill: rgba(138, 0, 16, 0.8);
          }
          .rug-list .rug-list-upload-button {
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            text-align: center;
            border: 2px solid transparent;
          }
          .rug-list .rug-list-upload-button svg {
            width: 15px;
            margin-top: 2px;
          }
          .rug-list .rug-list-upload-button svg polyline,
          .rug-list .rug-list-upload-button svg line {
            fill: none;
            stroke: black;
            stroke-linejoin: round;
            stroke-width: 3px;
            stroke-linecap: round;
          }
          .rug-list .rug-list-upload-button:hover {
            background-color: rgba(255, 255, 255, 0.9);
          }
          .rug-list .rug-list-upload-button:hover svg polyline,
          .rug-list .rug-list-upload-button:hover svg line {
            stroke: rgba(138, 0, 16, 0.8);
          }
          .rug-list .rug-list-upload-button:hover svg .__arrow {
            animation: 1s up-arrow forwards infinite;
          }
          .rug-list .rug-list-image {
            width: 100px;
            height: 70px;
            padding: 5px;
          }
          .rug-list .rug-list-image img {
            width: 100%;
            height: 100%;
          }
          .rug-list .rug-list-content {
            padding: 5px;
            width: calc(100% - 120px);
          }
          .rug-list .rug-list-content .rug-list-name {
            color: #f5f5f5;
            white-space: nowrap;
            font-size: 14px;
            text-overflow: ellipsis;
            position: relative;
            overflow: hidden;
            width: calc(100% - 40px);
          }
          .rug-list .rug-list-content .rug-list-size {
            color: #ddd;
            font-size: 12px;
            margin-top: 3px;
          }
          .rug-list .rug-list-remove {
            position: absolute;
            z-index: 40;
            top: 0;
            right: 0;
            color: #ccc;
            opacity: 0.75;
            border-radius: 9999px;
            padding: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .rug-list .rug-list-remove svg {
            stroke: currentColor;
            height: 22px;
            width: 22px;
          }
          .rug-list .rug-list-remove:hover {
            color: #fff;
          }

          @keyframes __spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .rug-dragging-item > div:not(.rug-list) {
            transform: scale(1.1);
          }
        `}</style>
      </Layout>
    );
  }
}

export default New;
