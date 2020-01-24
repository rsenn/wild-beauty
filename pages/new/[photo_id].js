import React from "react";
import { ItemEditor } from "../../components/views/itemEditor.js";
import { Element, HSLA } from "../../utils/dom.js";
import { toJS, action, set } from "mobx";
import { inject, observer } from "mobx-react";
import { trkl } from "../../utils/trkl.js";
import NeedAuth from "../../components/simple/needAuth.js";
import Layout from "../../components/layout.js";
import { BehaveHooks, Behave } from "../../utils/behave.js";
import { makeItemToOption, findInTree } from "../../stores/functions.js";

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

@inject("rootStore")
@observer
export class New extends React.Component {
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
    const rootStore = mobxStore.RootStore;
    const imageId = query.photo_id;
    let images = [];

    if(!global.window) {
      images = await rootStore.fetchImages(`{ id: { _eq: ${imageId} } }`);

      images = images.filter(ph => ph.items.length == 0);
      images.forEach(item => rootStore.newImage(item));
    }

    let image = images && images.length ? images[0] : null;

    if(image) rootStore.setState({ image: imageId });

        console.log("New.getInitialProps", { query });

    return { images };
  }

  constructor(props) {
    super(props);
    if(global.window) window.page = this;
    console.error({ Behave, BehaveHooks });
    const { rootStore, router } = this.props;
    let image = router.query.photo_id;
    if(image) {
      image = parseInt(image);
      if(rootStore.state.image != image) rootStore.setState({ image });
    }
  }

  componentDidMount() {
    const { rootStore, router } = this.props;
    //this.checkQuery();
    rootStore.loadItems().then(response => {
      if(response) {
        console.log("Items: ", response.items);
        let tree = rootStore.getItem(rootStore.rootItemId, makeItemToOption());
        console.log("this.state.tree", toJS(this.state.tree));
        this.setState({ tree });
      }
    });

    Element.findAll("textarea").forEach(e => {
      console.log("behave: ", e);
      behaveTextarea(e);
    });
  }

  @action.bound
  treeSelEvent(type, arg) {
    const { rootStore } = this.props;
    switch (type) {
      case "change": {
        console.log("treeSelEvent: ", this.state.tree, arg.value);
        const item = findInTree(this.state.tree, arg.value);
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
  }

  render() {
    const { rootStore, router, className, images } = this.props;
    const { query } = router;

    let img = images[0];

    console.log(`/new/${query.photo_id}`, query);
    // res.end(`Post: req:`, query.photo_id);

    console.log("New {:id}.render ", this.state.tree);

    const makeTreeSelEvent = name => event => this.treeSelEvent(name, event);

    return (
      <Layout>
        <NeedAuth>
          <div>
            <a href={`/new/${query.photo_id}`}>New item {query.photo_id}</a>
            {this.state.tree ? (
              <ItemEditor tree={this.state.tree} makeTreeSelEvent={makeTreeSelEvent} image={img} />
            ) : (
              undefined
            )}
          </div>
        </NeedAuth>
      </Layout>
    );
  }
}

export default New;
