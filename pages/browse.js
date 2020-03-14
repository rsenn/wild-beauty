import React from "react";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";

@inject("rootStore")
@observer
class Browse extends React.Component {
  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;
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
