import React, { useState } from "react";
import { inject, observer } from "mobx-react";
import {  toJS } from "mobx";



export const ItemView = inject("rootStore")(
  observer(({ rootStore, id }) => {
const item = rootStore.getItem(id);
console.log("Item ID: ", id);
console.log("Item: ", toJS(item));

    return (
      <div className={"item-view"}>
              <style jsx global>{`
        `}</style>
      </div>
      );
  }));

export default ItemView;