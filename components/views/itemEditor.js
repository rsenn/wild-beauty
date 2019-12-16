import React, { useState } from "react";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";
import { inject, observer } from "mobx-react";
import { AddItemBar } from "../views/addItemBar.js";
import { EditableText } from "../views/editableText.js";

import DropdownTreeSelect from 'react-dropdown-tree-select'
import "../../static/css/react-dropdown-tree-select.css";


export const ItemEditor = inject("rootStore")(
  observer(({ rootStore, tree, makeTreeSelEvent }) => (
    <div className={"content-edit"}>
      <div className={"item-photo"}>
        <div
          className={"item-entry"}
          style={{
            width: rootStore.currentImage.landscape ? `${(rootStore.currentImage.height * 100) / rootStore.currentImage.width}%` : "100%"
          }}
        >
          <SizedAspectRatioBox className={"item-box"}>
            <img
              id={`image-${rootStore.currentImage.id}`}
              className={"inner-image"}
              src={`/api/image/get/${rootStore.currentImage.id}.jpg`}
              width={rootStore.currentImage.width}
              height={rootStore.currentImage.height}
              orientation={rootStore.currentImage.landscape ? "landscape" : "portrait"}
              style={{
                width: rootStore.currentImage.landscape ? `${(rootStore.currentImage.width * 100) / rootStore.currentImage.height}%` : "100%",
                height: rootStore.currentImage.landscape ? "100%" : "auto"
              }}
            />
          </SizedAspectRatioBox>
        </div>
      </div>
      <div></div>
      <DropdownTreeSelect
        data={tree}
        onChange={makeTreeSelEvent("change")}
        onNodeToggle={makeTreeSelEvent("node-toggle")}
        onFocus={makeTreeSelEvent("focus")}
        onBlur={makeTreeSelEvent("blur")}
        className={"dropdown-tree"}
        mode={"radioSelect"}
        texts={{ placeholder: "parent item" }}
      />
      {rootStore.fields.map(field => (
        <EditableText
          multiline={false}
          hasDraft={false}
          className={"editable-text"}
          value={field.value}
          onValueChanged={newVal => {
            field.value = newVal;
          }}
        />
      ))}
      <AddItemBar onAdd={() => rootStore.fields.push({ type: null, value: "" })} />
    </div>
  ))
);

export default ItemEditor;