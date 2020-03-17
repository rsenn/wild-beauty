import React from "react";
import Gallery, { randomImagePaths } from "../components/gallery.js";
import Alea from "../lib/alea.js";
import { lazyInitializer } from "../lib/lazyInitializer.js";
import { SvgOverlay } from "../lib/svg-overlay.js";
import { action, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { ImageUpload, hvOffset } from "../components/views/imageUpload.js";
import { ItemEditor } from "../components/views/itemEditor.js";
import { trkl } from "../lib/trkl.js";
import NeedAuth from "../components/simple/needAuth.js";
import Layout from "../components/layout.js";
import { SelectionListener } from "../lib/touchHandler.js";
import { Element } from "../lib/dom.js";

const getPrng = () => Alea;
const imagePaths = lazyInitializer(() => randomImagePaths());

@inject("rootStore", "editorStore")
@observer
class New extends React.Component {
  currentPhoto = null;
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
    const rootStore = mobxStore["RootStore"];
    const editorStore = mobxStore["EditorStore"];

    let user_id;
    let images = [];

    if(req) user_id = rootStore.setAuthentication(req.cookies);

    if(!global.window) {
      if(user_id) {
        images = await rootStore.fetchImages({ user_id });
        images = images.filter(ph => ph.items.length == 0);
        images.forEach(item => rootStore.newPhoto(item));
      }
      const { url, query, body, route } = req || {};
      console.log("New.getInitialProps", { url });
    }

    editorStore.addField("Parent", "number", -1);

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
    this.touchListener = SelectionListener(
      event => {
        console.log("SelectionEvent", event);
      },
      { color: "#40ff00", shadow: "#000000" }
    );
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
    //    console.log("New.ĥandleClick", { shiftState });
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

    console.log("New.render", Object.keys(this.touchListener.events));

    return (
      <Layout scroll={false} toastsClick={this.handleClick} className={"noselect"} {...this.touchListener.events}>
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp}>
          <NeedAuth>
            <ImageUpload
              shiftState={this.shiftState}
              images={this.props.images}
              onChoose={this.chooseImage}
              onDelete={id => {
                let e = Element.find(`#image-${id}`);
                do {
                  if(e.parentElement == null) break;
                  e = e.parentElement;
                } while(!e.classList || !(e.classList.contains("image-entry") || e.classList.contains("upload-item")));
                rootStore.deletePhoto(id, result => {
                  Element.remove(e);
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

                rootStore.rotatePhoto(id, angle, ({ success, width, height }) => {
                  const landscape = width > height;
                  const aspect = width / height;
                  const orientation = landscape ? "landscape" : "portrait";

                  let { w, h, hr, vr } = hvOffset(width, height);

                  console.log("rotatePhoto result:", { success, width, height, w, h, hr, vr });
                  src = src.replace(/\?.*/g, "") + "?ts=" + Util.unixTime();

                  Element.attr(img, { src, width, height, style: `position: relative; width: ${w}%; height: ${h}%; margin-top: ${-vr / 2}%; margin-left: ${-hr / 2}%;` });
                  Element.attr(e, { ["data-tooltip"]: `${width}x${height} ${orientation}` });
                });
              }}
            />
          </NeedAuth>
        </div>
        <SvgOverlay svgRef={this.svgLayer} />
        <style jsx global>{`
          button.tag-remove {
            border: 1px outset #55555580;
          }
          .dropdown-tree {
          }
        `}</style>
      </Layout>
    );
  }
}

export default New;
