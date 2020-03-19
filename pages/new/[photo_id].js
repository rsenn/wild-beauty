import React from "react";
import { ItemEditor } from "../../components/views/itemEditor.js";
import { Element, Timer } from "../../lib/dom.js";
import { toJS, action } from "mobx";
import { inject, observer } from "mobx-react";
import NeedAuth from "../../components/simple/needAuth.js";
import Layout from "../../components/layout.js";
import { BehaveHooks, Behave } from "../../lib/behave.js";
import { makeItemToOption, findInTree } from "../../stores/functions.js";
import { makeTouchCallback } from "../../components/TouchCallback.js";
import { MovementListener, TouchListener } from "../../lib/touchHandler.js";

function behaveTextarea(element) {
  element = Element.find(element);
  /*
   * This hook adds autosizing functionality
   * to your textarea
   */
  BehaveHooks.add(["keydown"], function(data) {
    var numLines = data.lines.total,
      fontSize = parseInt(getComputedStyle(data.editor.element)["font-size"]),
      padding = parseInt(getComputedStyle(data.editor.element)["padding"]);
    data.editor.element.style.height = numLines * fontSize + padding + "px";
  });
  var editor = new Behave({
    textarea: element,
    replaceTab: true,
    softTabs: true,
    tabSize: 4,
    autoOpen: true,
    overwrite: true,
    autoStrip: true,
    autoIndent: true
  });
  return editor;
}

@inject("rootStore", "editorStore")
@observer
export class NewItem extends React.Component {
  state = {
    tree: null
  };

  /**
   * Gets the initial properties.
   *
   * @param      {<type>}   ctx     The context
   * @return     {Promise}  The initial properties.
   */
  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore["RootStore"];
    const editorStore = mobxStore["EditorStore"];

    let images = [],
      items = [];

    if(req) rootStore.setAuthentication(req.cookies);

    /*    if(!global.window) {
      const imageId = query.photo_id;
      images = toJS(await rootStore.fetchImages(`{ id: { _eq: ${imageId} } }`));
      images = images.filter(ph => ph.items.length == 0);
      images.forEach(item => rootStore.newPhoto(item));
      let image = images && images.length ? images[0] : null;
      if(image) rootStore.setState({ image: imageId });
      items = await rootStore.fetchItems();
    }*/
    items = await rootStore.loadItems();

    console.log("New[photo_id].getInitialProps", { images, items });

    return { photos: images, items };
  }

  constructor(props) {
    super(props);
    if(global.window) window.page = this;
    console.error({ Behave, BehaveHooks });
    const { rootStore, editorStore, router } = this.props;
    let image = router.query.photo_id;
    if(image) {
      image = parseInt(image);
      if(rootStore.state.image != image) rootStore.setState({ image });
    }

    editorStore.setTree(toJS(rootStore.getTree(rootStore.rootItemId, makeItemToOption(-1))));

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
      if(false)
        this.touchListener = TouchListener(
          event => {
            //console.log("Touch ", event);
            const elem = event.target;
            if(event.type.endsWith("start") && event.target.tagName.toLowerCase() == "img" && elem.classList.contains("inner-image")) {
              this.currentPhoto = event.target;
              let obj = Element.toObject(this.currentPhoto);
              const orientation = this.currentPhoto.getAttribute("orientation");
              let rect = Element.rect(this.currentPhoto);
              let prect = Element.rect(this.currentPhoto.parentElement.parentElement);
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
              if(this.clonedImage && this.currentPhoto) {
                let zIndex = parseInt(Element.getCSS(this.currentPhoto, "z-index")) - 1;
                let irect = Element.rect(this.currentPhoto);
                moveImage(event, this.currentPhoto);
              }
            }
            if(event.type.endsWith("end")) {
              if(this.clonedImage && this.currentPhoto) {
                this.currentPhoto.style.position = "relative";
                //console.log("currentOffset: ", this.currentOffset);
                //console.log("currentPhoto: ", this.currentPhoto);
                Element.remove(this.clonedImage);
                this.clonedImage = null;
              }
            }
          },
          { element: global.window, step: 1, round: true, listener: MovementListener, noscroll: true }
        );
    }

    if(global.window) {
      Timer.once(500, () => {
        let img = page.props.images && page.props.images[0];
        if(img && !this.colors) {
          this.colors = colors(Object.keys(img.colors), { width: 11 * 3, height: 11.5925 * 16 });
        }
      });
    }
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    //this.checkQuery();
    /*  rootStore.loadItems().then(response => {
      if(response) {
        console.log("Items: ", response.items);
          let tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());
        console.log("this.state.tree", toJS(this.state.tree));
        this.setState({ tree });
      }
    });*/

    Element.findAll("textarea").forEach(e => {
      console.log("behave: ", e);
      behaveTextarea(e);
    });
  }

  @action.bound
  treeSelEvent(type, arg) {
    const { rootStore, editorStore } = this.props;

    switch (type) {
      case "change": {
        const { checked, value, hide } = arg;
        console.log("treeSelEvent: ", { type, checked, value });

        editorStore.changeTree(
          item => true,
          item => (item.checked = false)
        );
        let item = editorStore.changeTree(value, item => (item.checked = true)); //        editorStore.parent = arg;
        editorStore.state.parent = arg.value; //        //rootStore.setState({ selected: arg.value });

        /*        const item = findInTree(editorStore.tree, arg.value);
        item.checked = true;
*/ console.log("treeSelEvent item=", toJS(item));
        break;
      }
      default: {
        //console.log("treeSelEvent: ", type, arg);
        break;
      }
    }
  }

  render() {
    const { rootStore, router, className, photos } = this.props;
    const { query } = router;
    let img = photos[0];
    //console.log(`/new/${query.photo_id}`, query);
    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);

    const { events } = this.touchListener || {};
    console.log("New {:id}.render", { events });

    return (
      <Layout {...events}>
        <NeedAuth>
          <div>
            <a href={`/new/${query.photo_id}`}>New item {query.photo_id}</a>

            <ItemEditor /*tree={this.state.tree}*/ makeTreeSelEvent={makeTreeSelEvent} image={img} />
          </div>
          <style jsx global>{`
            .colors-text {
              transition: opacity 1s linear;
              opacity: 0.2;
            }
            .colors-text:hover {
              opacity: 1;
            }
          `}</style>
        </NeedAuth>
      </Layout>
    );
  }
}

export default NewItem;
