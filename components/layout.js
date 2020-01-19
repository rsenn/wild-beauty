import React from "react";
import Head from "next/head";
import Nav from "../components/nav.js";

export const Layout = props => (
  <div className={"page-layout"}>
    <Head>
      <title>New</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Nav>
    {/*  {global.window ? window.site.label(props) : undefined} -{" "}
      {global.window ? window.site.description(props) : undefined}*/}
    </Nav>
    <div className={"content-layout"}>{props.children}</div>
  </div>
);

export default Layout;
