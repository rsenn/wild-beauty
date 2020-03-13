import React from "react";
import App from "next/app";
import { Router } from "next/router";
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
    ctx.mobxStore = mobxStore;
    const basePageProps = {
      initialMobxState: mobxStore // store that will be serialized for ssr (see constructor)
    };
    const rootStore = basePageProps.initialMobxState["RootStore"];
    var pageProps = { ...basePageProps };
    const getInit =
      Component.getInitialProps ||
      (() => {
        return {};
      });
    if(typeof getInit == "function") {
      let pageCtx = { ...ctx, ...basePageProps };
      // inject the basePageProps in the parameters of getInitialProps
      pageProps = await getInit(ctx);

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
    //console.log("App pageProps=", pageProps);

    return { pageProps };
  }

  constructor(props) {
    super(props);
    const { router } = props;
    this.mobxStore = getOrCreateStore(!global.window, props.pageProps.initialMobxState);
    const pageName = router.pathname.replace(/^\//, "");
    if(global.window) {
      window.Util = Util;
      window.stores = this.mobxStore;
      window.site = Util.find(SiteMap, pageName, "name");
    }

    Router.events.on("routeChangeStart", url => {
      console.log("App is changing to: " + url);
    });

    //console.log("App.constructor", pageName /*, props.pageProps*/);
  }

  componentDidMount(props) {
    const { router } = this.props;

    const rootStore = this.mobxStore.RootStore;

    const handleRouteChange = url => {
      console.log("App is changing to: ", url);

      rootStore.setState({ loading: true });
    };

    // Router.events.on("routeChangeStart", handleRouteChange);

    //console.log("App.componentDidMount ", router.query);
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
        <Provider rootStore={this.mobxStore.RootStore} i18nStore={i18nStore} store={this.mobxStore}>
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
              font-size: 10px;
            }
          }

          #__next {
            margin: 0px;
            padding: 0px;
            overflow-x: hidden;
          }
          .page-layout {
            position: absolute;
            display: block;
            width: 100%;
            height: 100%;
          }
          .content-layout {
            padding: 0 0 0 0;
            margin: 0 0 0 0;
            width: 100vw;
            text-align: center;
            display: flex;
            flex-flow: column nowrap;
            justify-content: flex-start;
            align-items: center;
            z-index: 1;
            position: relative;
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
            background: linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
            background: -webkit-linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
          }
          button:active {
            border: 1px inset #555555;
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
        `}</style>
      </React.Fragment>
    );
  }
}

export default withRouter(MyApp);
