import React from "react";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";

@inject("rootStore")
@observer
class Browse extends React.Component {
  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;

    let items = await rootStore.fetchItems("{children: {id: {_gte: 1}}},order_by: {order: asc}");
    console.log("Browse.getInitialProps", { items });

    return {};
  }

  constructor(props) {
    super(props);
    if(global.window) {
      window.page = this;
    }
  }

  render() {
    const { rootStore } = this.props;
    console.log("Browse.render");
    return (
      <Layout>
        <div></div>
        <style jsx global>{``}</style>
      </Layout>
    );
  }
}

export default Browse;
