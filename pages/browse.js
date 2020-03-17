import React from "react";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";
import CircleSegment from "../components/simple/circleSegment.js";
import { RGBA, HSLA, Line } from "../lib/dom.js";

const DEG2RAD = Math.PI / 180;

@inject("rootStore")
@observer
class Browse extends React.Component {
  state = {};

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

    this.setState({ progress: 0 });
  }

  render() {
    const { rootStore } = this.props;
    const { progress } = this.state;
    console.log("Browse.render");

    let line = new Line(1, 0, progress <= 50 ? -1 : 0, progress <= 25 ? 2 : 1);

    return (
      <Layout>
        <div></div>
        <svg viewBox={`0 0 100 100`} style={{ width: "50%", height: "auto" }}>
          <defs>
            <linearGradient id='MyGradient' {...line.toObject()}>
              <stop offset='0%' stopColor='rgba(255,255,255,0.25)' />
              <stop offset='50%' stopColor='rgba(127,127,127,0.5)' />
              <stop offset='100%' stopColor='rgba(0,0,0,0.75)' />
            </linearGradient>
          </defs>
          <CircleSegment x={50} y={50} r={45} start={-90 * DEG2RAD} end={(-90 + (progress * 360) / 100) * DEG2RAD} fill={"url(#MyGradient)"} stroke={"black"} strokeWidth={0.2} close />
        </svg>
        <style jsx global>{``}</style>
      </Layout>
    );
  }
}

export default Browse;
