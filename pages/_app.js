import React from "react";
import Head from "next/head";
import App, { Container } from "next/app";
import { Router } from "next/router";
import { Provider } from "mobx-react";
import Util from "../utils/util.js";
import { createStore, getOrCreateStore } from "../stores/createStore.js";
import { singleton } from "../stores/RootStore.js";
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
      //console.log(`App.getInitialProps ${componentName}.getInitialProps() profile=`, pageProps.profile );
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
    console.log("App.constructor", pageName);
  }

  componentDidMount(props) {
    const { router } = this.props;

    const rootStore = this.mobxStore.RootStore;

    Router.events.on("routeChangeStart", () => {
      console.log("routeChangeStart ", router.query);
      rootStore.setState({ loading: true });
    });

    Router.events.on("routeChangeComplete", () => {
      console.log("routeChangeComplete ", router.query);
      rootStore.setState({ loading: false });
    });

    console.log("App.componentDidMount ", router.query);
    const obj = ["step", "image", "selected"].reduce((acc, key) => (router.query[key] !== undefined ? { ...acc, [key]: parseInt(router.query[key]) } : acc), {});
    console.log("newState: ", obj);

    rootStore.setState(obj);
  }

  render() {
    const { Component, pageProps, router } = this.props;

    if(Util.isBrowser()) window.component = Component;

    //console.log("App.render", mobxStore);
    return (
      <Container>
        <Head>
          <title>StarLottery</title>
        </Head>
        <Provider rootStore={this.mobxStore.RootStore} i18nStore={i18nStore} store={this.mobxStore}>
          <Component {...pageProps} router={router} key={Router.route} />
        </Provider>
        <style jsx global>{`
          @font-face {
            font-family: "Fixed";
            src: url("static/fonts/Fixed-Medium.eot");
            src: url("static/fonts/Fixed-Medium.eot?#iefix") format("embedded-opentype"), url("static/fonts/Fixed-Medium.woff2") format("woff2"), url("static/fonts/Fixed-Medium.woff") format("woff"), url("static/fonts/Fixed-Medium.ttf") format("truetype"),
              url("static/fonts/Fixed-Medium.svg#Fixed-Medium") format("svg");
            font-weight: 500;
            font-style: normal;
          }

          body {
            font-family: Fixed;
            font-size: 13px;
            background: url(static/img/tile-background.png) repeat;
            background-size: auto 50vmin;
            margin: 0;
          }

          .page-layout {
            margin: 80px 0 0 0;
            width: 100vw;
            text-align: center;
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
            z-index: 1;
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
          :focus {
            outline: none !important;
          }
          button.icon {
            padding: 0px;
          }
          body {
            position: absolute;
            top: 0;
            width: 100vw;
            height: 100vh;
          }
          .title-bar {
            position: absolute;
            left: 0.5em;
            top: 0.5em;
            text-align: left;
            color: black;
            padding-left: 10px;
            font-size: 2em;
            font-family: Fixed;
          }
        `}</style>
      </Container>
    );
  }
}

export default withRouter(MyApp);
