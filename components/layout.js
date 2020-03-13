import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import ToastsContainer from "./views/toastsContainer.js";
import classNames from "classnames";

export const Layout = ({ title, toastsClick, className, scroll = true, hideNav, ...props }) => (
  <React.Fragment>
    <Head>
      <title>{title}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={classNames("page-layout", className)} style={{ overflowY: scroll ? "auto" : "hidden", overflowX: "hidden" }} {...props}>
      {hideNav ? undefined : <Nav />}
      <div className={"content-layout"} style={scroll ? {} : { overflow: "hidden" }}>
        {props.children}
      </div>
    </div>
    <ToastsContainer onClick={toastsClick} />
    <style jsx global>{`
      .page-layout {
        width: 100vw;
      }
      .toasts-container {
        position: fixed;
        bottom: 0;
        right: 0;
      }
    `}</style>
  </React.Fragment>
);

export default Layout;
