import React from "react";
import { inject, observer } from "mobx-react";
import { Grid, GridItem } from "../components/views/grid.js";
import { ItemTile } from "../components/views/itemTile.js";
import Layout from "../components/layout.js";

@inject("rootStore")
@observer
class Browse extends React.Component {
  static async getInitialProps({ res, req, query, asPath, mobxStore }) {
    const rootStore = mobxStore.RootStore;
    const categoryId = query.category || 4;
    let api = rootStore.api;
    Browse.api = api;
    let result,
      items = [];
    result = await Browse.api(
      `query MyQuery { items(where: {id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id width height } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    result = await Browse.api(
      `query MyQuery { items(where: {parent_id: {_eq: ${categoryId}}}) { id data children { id } parent { id parent { id } } photos { photo { id width height } } users { user { id } } } }`
    );
    if(result.items) items = items.concat(result.items);
    let depth, children;
    return { items, categoryId, depth, children };
  }

  constructor(props) {
    super(props);
    if(global.window) window.page = this;
  }

  render() {
    const { rootStore, categoryId, items, depth } = this.props;
    let rows = Math.max(3, depth + 1);
    let children = [...rootStore.items.keys()]
      .filter(k => {
        const item = rootStore.items.get(k);
        if(item && (item.parent ? item.parent.id == categoryId : item.parent_id == categoryId)) return true;
        return false;
      })
      .map(key => rootStore.items.get(key));
    return (
      <Layout>
        <div className={"grid-container"}>
          Browse
          <Grid
            className={"browse-grid"}
            rows={`repeat(${rows}, ${100 / rows}fr)`}
            cols={`repeat(5, 20fr)`}
            style={{ gridGap: "10px" }}
          >
            {children.map((child, i) => (
              <GridItem key={`grid-item-${i}`} row={rows} col={i + 1}>
                <ItemTile id={child.id} />
              </GridItem>
            ))}
          </Grid>
        </div>
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
      </Layout>
    );
  }
}

export default Browse;
