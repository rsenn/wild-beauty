import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";
import ToastsContainer from "./views/toastsContainer.js";

export const Layout = ({ toastsClick, ...props }) => (
  <React.Fragment>
    <div className={"page-layout"} {...props}>
      <Head>
        <title>New</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav>{/*  {global.window ? window.site.label(props) : undefined} -{" "}
      {global.window ? window.site.description(props) : undefined}*/}</Nav>
      <div className={"content-layout"}>{props.children}</div>
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
