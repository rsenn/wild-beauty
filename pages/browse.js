import React from "react";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";
import CircleSegment from "../components/simple/circleSegment.js";

const DEG2RAD = Math.PI / 180;

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
        <svg viewBox={`0 0 200 200`} style={{ width: "100%", height: "auto" }}>
          <CircleSegment x={100} y={100} r={50} start={-90 * DEG2RAD} end={-45 * DEG2RAD} fill={"magenta"} />
          <CircleSegment x={100} y={100} r={50} start={-15 * DEG2RAD} end={120 * DEG2RAD} fill={"none"} stroke={"#0ff"} />
          <CircleSegment x={100} y={100} r={50} start={135 * DEG2RAD} end={245 * DEG2RAD} fill={"none"} stroke={"#ff0"} />
        </svg>
        <style jsx global>{``}</style>
      </Layout>
    );
  }
}

export default Browse;
