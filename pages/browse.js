import React from "react";
import { inject, observer } from "mobx-react";
import axios from "../utils/axios.js";
import { Grid, GridItem } from "../components/views/grid.js";
import Util from "../utils/util.js";

@inject("rootStore")
@observer
class Browse extends React.Component {
  /**
   * Gets the initial properties.
   *
   * @param      {Object}   arg1            The argument 1
   * @param      {<type>}   arg1.res        The resource
   * @param      {<type>}   arg1.req        The request
   * @param      {<type>}   arg1.query      The query
   * @param      {<type>}   arg1.asPath     As path
   * @param      {<type>}   arg1.mobxStore  The mobx store
   * @return     {Promise}  The initial properties.
   */
  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;
    const catId = query.category || 4;
    let api = rootStore.api;
    Browse.api = api;
    let result,
      items = [];
    result = await Browse.api(
      `query MyQuery { items(where: {id: {_eq: ${catId}}}) { id data children { id } parent { id parent { id } } photos { photo { id } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    result = await Browse.api(
      `query MyQuery { items(where: {parent_id: {_eq: ${catId}}}) { id data children { id } parent { id parent { id } } photos { photo { id } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    console.log("Browse.getInitialProps ", { items });
    return { items };
  }

  constructor(props) {
    super(props);

    if(global.window) window.page = this;
  }

  render() {
    return (
      <div className={"grid-container"}>
        Browse
        <Grid className={"browse-grid"} rows={`repeat(5, 20fr)`} cols={`repeat(5, 2fr)`} style={{ gridGap: "10px" }}>
          <GridItem row={1} col={"1"} style={{ background: "rgba(255,0,0,0.5)" }}>
            A
          </GridItem>
          <GridItem row={1} col={"2"} style={{ background: "rgba(255,0,0,0.5)" }}>
            B
          </GridItem>
          <GridItem row={1} col={"3"} style={{ background: "rgba(255,0,0,0.5)" }}>
            C
          </GridItem>
          <GridItem row={1} col={"4"} style={{ background: "rgba(255,0,0,0.5)" }}>
            D
          </GridItem>
          <GridItem row={1} col={"5"} style={{ background: "rgba(255,0,0,0.5)" }}>
            E
          </GridItem>
          <GridItem row={3} col={"1"} style={{ background: "rgba(0,127,0,0.5)" }}>
            A
          </GridItem>
          <GridItem row={3} col={"2"} style={{ background: "rgba(0,127,0,0.5)" }}>
            B
          </GridItem>
          <GridItem row={5} col={"1"} style={{ background: "rgba(0,60,255,0.5)" }}>
            C
          </GridItem>
          <GridItem row={5} col={"2"} style={{ background: "rgba(0,60,255,0.5)" }}>
            D
          </GridItem>
          <GridItem row={5} col={"3"} style={{ background: "rgba(0,60,255,0.5)" }}>
            E
          </GridItem>
        </Grid>
        <style jsx global>{`
          .grid-container {
            display: flex;
            justify-content: center;
          }
          .browse-grid {
            margin: 50px 0 50px 0;
            border: 1px dashed black;
            height: 100%;
            width: 90vw;
          }
          .grid-container,
          .browse-grid {
            overflow: visible;
          }
          .browse-grid > div,
          .grid-item {
            background-color: rgba(255, 0, 0, 0.5);
          }
          .grid-item {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2em;
            box-shadow: 0px 0px 8px 1px rgba(0, 0, 0, 1);
          }
        `}</style>
      </div>
    );
  }
}

export default Browse;
