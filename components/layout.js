import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import ToastsContainer from "./views/toastsContainer.js";
import classNames from "classnames";

export const Layout = ({ title = "The wild beauty company", toastsClick, className, scroll = true, hideNav, ...props }) => (
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
        position: relative;
        width: 100vw;
      }
      .content-layout {
        position: relative;

        padding: 0 25px 0 10px;
        margin: 0 0 0 0;
      }
      .page-layout {
        position: absolute;
        display: block;
        width: 100vw;
        min-height: 100vh;
        overflow: visible;
      }
      .content-layout {
        text-align: center;
        z-index: 1;
        position: relative;
      }
      .flex-layout {
        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        align-items: center;
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
