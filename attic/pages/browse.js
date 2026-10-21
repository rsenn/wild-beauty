import React from "react";
import { inject, observer } from "mobx-react";
import Layout from "../components/layout.js";
import CircleSegment from "../components/simple/circleSegment.js";
import { RGBA, HSLA, Line } from "../lib/dom.js";

const DEG2RAD = Math.PI / 180;

@inject("rootStore")
@observer
class Browse extends React.Component {
  state = { progress: 75 };

  static async getInitialProps({ res, req, query, params, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;

    let fields = [
      "id",
      "name",
      "type",
      "parent { id }",
      "order",
      "children(order_by: {order: asc}) { id name type }",
      "data",
      "photos { photo { id } }",
      "users { user { id } }",
      "children_aggregate { aggregate {count } }"
    ];
    let items;

    try {
      items = await rootStore.api.list("items", fields, {
        order_by: "{parent: { id: asc }, order: asc, created: asc}",
        where: "{parent_id:{_gte:1}}"
      });
    } catch(e) {
      items = [];
    }

    return { items, query, params };
  }

  constructor(props) {
    super(props);
    if(global.window) {
      window.page = this;
    }
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
          <CircleSegment
            x={50}
            y={50}
            r={45}
            start={-90 * DEG2RAD}
            end={(-90 + (progress * 360) / 100) * DEG2RAD}
            fill={"url(#MyGradient)"}
            stroke={"black"}
            strokeWidth={0.2}
            close
          />
        </svg>
        <style jsx global>{``}</style>
      </Layout>
    );
  }
}

export default Browse;
