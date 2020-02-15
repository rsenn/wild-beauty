import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import ToastsContainer from "./views/toastsContainer.js";
import classNames from "classnames";

export const Layout = ({ toastsClick, className, scroll = true, hideNav, ...props }) => (
  <React.Fragment>
    <div className={classNames("page-layout", className)} style={{ overflow: scroll ? 'auto' : 'hidden' }} {...props}>
      <Head>
        <title>New</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {hideNav ? undefined : <Nav />}
      <div className={"content-layout"} style={  scroll ? {} : { overflow: 'hidden' }} >{props.children}</div>
    </div>
    <ToastsContainer onClick={toastsClick} />
    <style jsx global>{`
      .toasts-container {
        position: fixed;
        bottom: 0;
        right: 0;
      }
    `}</style>
  </React.Fragment>
);

export default Layout;
