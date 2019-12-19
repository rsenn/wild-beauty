import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import flush from 'styled-jsx/server';

export default class DefaultDocument extends Document {
  render() {
    const styles = flush();
    return (
      <html>
        <Head>
          {styles}
          <meta
            name="viewport"
            content={'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'            }
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
