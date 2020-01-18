import React from "react";
import { toJS } from "mobx";
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
    const categoryId = query.category || 4;
    let api = rootStore.api;
    Browse.api = api;
    let result,
      items = [];
    result = await Browse.api(
      `query MyQuery { items(where: {id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    result = await Browse.api(
      `query MyQuery { items(where: {parent_id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    console.log("Browse.getInitialProps ", { items });

    let depth = await rootStore.getDepth(categoryId);
    let children = await rootStore.getChildren(categoryId);
    if(children) items = items.concat(children);

    return { items, categoryId, depth, children };
  }

  constructor(props) {
    super(props);

    if(global.window) window.page = this;
  }

  render() {
    const { rootStore, categoryId, items, depth } = this.props;

    let rows = Math.max(3, depth + 1);

    let children =  [...rootStore.items.keys()].filter( k => { const item = rootStore.items.get(k); 
console.log("item: ", toJS(item));
      if(item && (item.parent ? item.parent.id == categoryId : item.parent_id == categoryId))
      return true;
      return false;
    }).map(key => rootStore.items.get(key));
    
    console.log("Browse.render ", { categoryId, depth, rows, children });


//    if(typeof children != "object" || children === null || children.length === undefined) children = [];


    return (
      <div className={"grid-container"}>
        Browse
        <Grid
          className={"browse-grid"}
          rows={`repeat(${rows}, ${100/rows}fr)`}
          cols={`repeat(5, 20fr)`}
          style={{ gridGap: "10px" }}
        >
          <GridItem row={1} col={"2"} style={{ background: "rgba(255,0,0,0.5)" }}>
            B
          </GridItem>
          <GridItem row={1} col={"3"} style={{ background: "rgba(255,0,0,0.5)" }}>
            C
          </GridItem>
          <GridItem row={1} col={"4"} style={{ background: "rgba(255,0,0,0.5)" }}>
            D
          </GridItem>
       {/*   <GridItem row={1} col={"5"} style={{ background: "rgba(255,0,0,0.5)" }}>
            E
          </GridItem>
          <GridItem row={2} col={"2"} style={{ background: "rgba(0,127,0,0.5)" }}>
            B
          </GridItem>
          <GridItem row={2} col={"3"} style={{ background: "rgba(0,60,255,0.5)" }}>
            D
          </GridItem>
          <GridItem row={2} col={"4"} style={{ background: "rgba(0,60,255,0.5)" }}>
            E
          </GridItem>*/}
          {children.map((child, i) => (
            <GridItem row={rows} col={i + 1}>
              {child.name ? `Name: ${child.name}` : `Id: ${child.id}`}
            </GridItem>
          ))}
        </Grid>
        <style jsx global>{`
          .grid-container {
            padding: 0 20px;
          }
          .browse-grid {
            margin: 50px 0 50px 0;
            border: 1px dashed black;
            height: 100%;
            width: 100%;
        
          }
          .grid-container,
          .browse-grid {
            overflow: visible;
          }
          .browse-grid > div,
          .grid-item {
            background-color: rgba(128, 0, 128, 0.5);
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
