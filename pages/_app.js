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
            font-family: "Jewel Hill";
            src: url("/static/fonts/hinted-JewelHill.eot");
            src: local("Jewel Hill"), local("JewelHill"),
              url("/static/fonts/hinted-JewelHill.eot?#iefix") format("embedded-opentype"),
              url("/static/fonts/hinted-JewelHill.woff2") format("woff2"),
              url("/static/fonts/hinted-JewelHill.woff") format("woff"),
              url("/static/fonts/hinted-JewelHill.ttf") format("truetype"),
              url("/static/fonts/hinted-JewelHill.svg#JewelHill") format("svg");
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: "Manjari Regular";
            src: url("/static/fonts/hinted-Manjari-Regular.eot");
            src: local("Manjari Regular"), local("Manjari-Regular"),
              url("/static/fonts/hinted-Manjari-Regular.eot?#iefix") format("embedded-opentype"),
              url("/static/fonts/hinted-Manjari-Regular.woff2") format("woff2"),
              url("/static/fonts/hinted-Manjari-Regular.woff") format("woff"),
              url("/static/fonts/hinted-Manjari-Regular.ttf") format("truetype"),
              url("/static/fonts/hinted-Manjari-Regular.svg#Manjari-Regular") format("svg");
            font-weight: normal;
            font-style: normal;
          }

          body,
          html {
            font-size: 20px;
          }
        `}</style>
      </Container>
    );
  }
}

export default withRouter(MyApp);
