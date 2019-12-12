import React from "react";
import Head from "next/head";
import App, { Container } from "next/app";
import { Provider } from "mobx-react";
import Util from "../utils/util.js";
import { Router } from "next/router";
import { createStore, getOrCreateStore } from "../stores/createStore.js";
import { withRouter } from "next/router";

class MyApp extends App {
  static async getInitialProps({ Component, router, ctx }) {
    // create a store with the initial state
    const mobxStore = createStore(!Util.isBrowser());
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
    //console.log(componentName + ' pageProps=', pageProps);

    return { pageProps };
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { Component, pageProps, router } = this.props;

    const mobxStore = getOrCreateStore();

    if(Util.isBrowser()) window.component = Component;

    //console.log('App.render\n', process.env.BUILD_ID);
    return (
      <Container>
        <Head>
          <title>StarLottery</title>
        </Head>
        <Provider rootStore={mobxStore.RootStore} store={mobxStore}>
          <Component {...pageProps} router={router} key={Router.route} />
        </Provider>
        <style jsx global>{`
          @font-face {
            font-family: "Fixed";
            src: url("static/fonts/Fixed-Medium.eot");
            src: url("static/fonts/Fixed-Medium.eot?#iefix") format("embedded-opentype"), url("static/fonts/Fixed-Medium.woff2") format("woff2"), url("static/fonts/Fixed-Medium.woff") format("woff"), url("static/fonts/Fixed-Medium.ttf") format("truetype"), url("static/fonts/Fixed-Medium.svg#Fixed-Medium") format("svg");
            font-weight: 500;
            font-style: normal;
          }

          body,
          html {
            font-family: Fixed;
            font-size: 13px;
            background: url(static/img/tile-background.jpg) repeat;
            background-size: 100vmin auto;
            margin: 0;
          }

          .page-layout {
            margin: 50px 0 0 0;
            width: 100vw;
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1;
          }
        `}</style>
      </Container>
    );
  }
}

export default withRouter(MyApp);
