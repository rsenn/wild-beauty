import React from "react";
import App from "next/app";
import { Router } from "next/router";
import { toJS } from "mobx";
import { Provider } from "mobx-react";
import Util from "../lib/util.js";
import { getOrCreateStore } from "../stores/createStore.js";
import { withRouter } from "next/router";
import i18nStore from "../stores/i18nStore.js";
import SiteMap from "../components/siteMap.js";

class MyApp extends App {
  static async getInitialProps({ Component, router, ctx }) {
    // create a store with the initial state
    const mobxStore = getOrCreateStore(!Util.isBrowser());
    console.log("mobxStore:", Object.keys(mobxStore));
    ctx.mobxStore = mobxStore;
    const basePageProps = {
      initialMobxState: mobxStore // store that will be serialized for ssr (see constructor)
    };
    const rootStore = basePageProps.initialMobxState["RootStore"];
    const editorStore = basePageProps.initialMobxState["EditorStore"];
    var pageProps = { ...basePageProps };
    const getInit =
      Component.getInitialProps ||
      (() => {
        return {};
      });
    if(typeof getInit == "function") {
      let pageCtx = { ...ctx, ...basePageProps, mobxStore };
      // inject the basePageProps in the parameters of getInitialProps
      pageProps = await getInit(pageCtx);

      console.log("App pageProps=", Object.fromEntries(Object.entries(pageProps).map(([key, value]) => [key, Util.isArray(value) || (typeof value == "object" && value !== null && value.length !== undefined) ? `Array(${value.length})` : typeof value])));

      if(pageProps.items) {
        pageProps.items.forEach(item => {
          //console.log("rootStore.items.set ", item.id, item);
          rootStore.items.set("" + item.id, item);
        });
      }

      //console.log(`App.getInitialProps `, { pageProps });
      // return the basePageProps inside the pageProps
      pageProps = { ...basePageProps, ...pageProps };
    } else {
      //console.log(`App.getInitialProps ${componentName} has no getInitialProps!`);
    }

    return { pageProps };
  }

  constructor(props) {
    super(props);
    const { router, pageProps } = props;
    this.mobxStore = getOrCreateStore(!global.window, props.pageProps.initialMobxState, props.pageProps);
    //console.log("App.constructor", { pageProps: Object.keys(pageProps) });

    const rootStore = this.mobxStore.RootStore;
    const editorStore = this.mobxStore.EditorStore;

    if(pageProps.items !== undefined && pageProps.items !== null) {
      // console.log("pageProps.items", pageProps.items);
      let items = pageProps.items.map(item => ["" + item.id, item]);
      rootStore.items.clear();
      rootStore.items.merge(items);
      console.log(`items.length=`, items.length, ` rootStore.items.size=${rootStore.items.size}`);
    }
    if(pageProps.photos !== undefined) {
      let photos = pageProps.photos.map(photo => ["" + photo.id, photo]);
      rootStore.photos.clear();
      rootStore.photos.merge(photos);
      console.log(`photos.length=`, photos.length, ` rootStore.photos.size=${rootStore.photos.size}`);
    }

    const pageName = router.pathname.replace(/^\//, "");
    if(global.window) {
      window.Util = Util;
      window.stores = this.mobxStore;
      window.site = Util.find(SiteMap, pageName, "name");
    }
    /*
    if(pageProps) {
      const { initialMobxState } = pageProps;
      const items = initialMobxState["RootStore"].items, photos = initialMobxState["RootStore"].photos;
      //console.log("App.constructor", Object.keys(initialMobxState));

      if(items && items.size > 0)
      rootStore.items.replace(items);
          if(photos && photos.size  > 0)

      rootStore.photos.replace(photos);
    }*/

    Router.events.on("routeChangeStart", url => {
      console.log("App is changing to: " + url);
    });
  }

  componentDidMount(props) {
    const { router, pageProps } = this.props;

    const rootStore = this.mobxStore.RootStore;
    const editorStore = this.mobxStore.EditorStore;

    const handleRouteChange = url => {
      console.log("App is changing to: ", url);

      rootStore.setState({ loading: true });
    };

    // Router.events.on("routeChangeStart", handleRouteChange);

    console.log("App.componentDidMount ", router.query);
    const obj = ["step", "image", "selected"].reduce((acc, key) => (router.query[key] !== undefined ? { ...acc, [key]: parseInt(router.query[key]) } : acc), {});
    //console.log("newState: ", obj);

    rootStore.setState(obj);
  }

  render() {
    const { Component, pageProps, router, initialMobxState } = this.props;

    if(Util.isBrowser()) window.component = Component;

    //console.log("App.render");
    return (
      <React.Fragment>
        <Provider rootStore={this.mobxStore.RootStore} editorStore={this.mobxStore.EditorStore} i18nStore={i18nStore} store={this.mobxStore}>
          <Component {...pageProps} router={router} key={Router.route} />
        </Provider>

        <style jsx global>{`
          @font-face {
            font-family: "Fixed";
            src: url("/static/fonts/Fixed-Medium.eot");
            src: url("/static/fonts/Fixed-Medium.eot?#iefix") format("embedded-opentype"), url("/static/fonts/Fixed-Medium.woff2") format("woff2"), url("/static/fonts/Fixed-Medium.woff") format("woff"), url("/static/fonts/Fixed-Medium.ttf") format("truetype"), url("/static/fonts/Fixed-Medium.svg#Fixed-Medium") format("svg");
            font-weight: 500;
            font-style: normal;
          }

          body {
            font-family: Fixed;
            font-size: 13px;
            background: url(/static/img/tile-background.png) repeat;
            background-size: auto 50vmin;
            margin: 0;
          }
          @media (max-width: 375px) {
            body {
              font-size: 14px;
            }
            .content-layout {
              padding: 0px 10px;
            }
          }

          #__next {
            margin: 0px;
            padding: 0px;
            overflow-x: hidden;
          }
          html,
          body,
          .page-layout,
          .content-layout {
            overflow-x: hidden;
          }

          button,
          textarea,
          input,
          select,
          a {
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          textarea,
          input,
          select {
            -webkit-user-select: text;
            -khtml-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
          }
          :focus {
            outline: none !important;
          }
          button.icon {
            padding: 0px;
          }
          body {
            margin: 0px;
            padding: 0px;
          }

          .title-bar > span {
            white-space: pre;
          }

          button {
            -webkit-appearance: none;
            border: 1px outset #555555;
            border-radius: 5px;
            -webkit-border-radius: 5px;
            box-sizing: border-box;
            background: linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
            background: -webkit-linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
          }
          button:active:enabled {
            border: 1px inset #aaa;
            background: linear-gradient(bottom, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
            background: -webkit-linear-gradient(bottom, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
          }
          button:active:enabled > svg,
          button:active:enabled > img {
            transform: translate(1px, 1px);
          }
          button:hover:enabled {
            box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.6);
          }
          button:active:enabled {
            box-shadow: none;
          }
          .tooltip:after {
            background: linear-gradient(to bottom, #ffda15ff 0%, #f3c500ff 100%);
            color: #000;
            margin: 10px 3px;
            padding: 8px;
            -webkit-border-radius: 4px;
            -moz-border-radius: 4px;

            border-radius: 4px;
            box-shadow: 5px 5px 10px 2px rgba(0, 0, 0, 0.62);
          }
          button:disabled {
            filter: grayscale(100%);
            box-shadow: none;
          }
        `}</style>
      </React.Fragment>
    );
  }
}

export default withRouter(MyApp);
