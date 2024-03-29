import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import flush from "styled-jsx/server";

export default class DefaultDocument extends Document {
  render() {
    const styles = flush();
    return (
      <Html>
        <Head>
          {styles}
          <link rel='stylesheet' type='text/css' href='static/style.css' />
          <meta name='viewport' content={"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"} />
          <meta name='version' content={"20200313"} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
