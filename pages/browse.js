import React from "react";
import { inject, observer } from "mobx-react";
import axios from "../utils/axios.js";
import { Grid } from "../components/views/grid.js";
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
    return <div>Browse

    <Grid rows={5} cols={5} /></div>;
  }
}

export default Browse;
