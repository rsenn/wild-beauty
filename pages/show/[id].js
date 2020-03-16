import React from "react";
import { ItemView } from "../../components/views/itemView.js";
import Nav from "../../components/nav.js";
import Head from "next/head";

export class ShowItem extends React.Component {
  static async getInitialProps(ctx) {
    const { err, req, res, pathname, query, asPath, AppTree, mobxStore } = ctx;
    const rootStore = mobxStore.RootStore;
    let item = await rootStore.loadItem({ id: query.id });
    console.log("item: ", item);
    return { item, query };
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { initialMobxState, className, item, query } = this.props;
    //   console.log(`props:`, { item});
    return (
      <div className={"page-layout"}>
        <Head>
          <title>Show</title>
          <link rel='icon' href='/favicon.ico' />
        </Head>
        <Nav />
        Id: {query.id}
        <ItemView id={query.id} />
      </div>
    );
  }
}

export default ShowItem;
