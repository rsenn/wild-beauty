import React, { useState } from "react";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";
import { inject, observer } from "mobx-react";
import { AddItemBar } from "../views/addItemBar.js";
import { EditableField } from "../simple/editableField.js";

import DropdownTreeSelect from "react-dropdown-tree-select";
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
      {rootStore.entries.map(field => (
        <EditableField
          options={rootStore.fieldNames}
          multiline={false}
          hasDraft={false}
          className={"editable-field"}
          value={field.value}
          onValueChanged={newVal => {
            field.value = newVal;
          }}
        />
      ))}
      <AddItemBar onAdd={() => rootStore.entries.push({ type: null, value: "" })} />
      <style jsx global>{`
        .content-edit {
          width: 80vw;
          padding: 0px 20px;
          display: flex;
          flex-flow: column nowrap;
          justify-content: flex-start;
          align-items: flex-start;
        }
        .item-entry {
          margin: 10px;
        }
        .item-photo {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .aspect-ratio-box {
          overflow: hidden;
        }
        .editable-text {
          margin: 4px 0px;
          width: 100%;
        }
        .button-add:active > svg {
          transform: translate(1px, 2px);
        }
        .editable-field {
          width: 100%;
          margin: 2px 0;
        }
        .editable-field > button {
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
        }
        .editable-field-name,
        .editable-field-value-content {
          flex: 1 0 auto;
          min-height: 34px;
          font-size: 20px;
          background-color: rgba(255, 255, 255, 0.6);
        }
        div.editable-field-value-content {
          text-align: left;
          border: 1px dashed black;
          display: flex;
          justify-content: center;
          align-content: center;
          flex-direction: column;
        }
        input.editable-field-value-content {
          font-family: Fixed;
          border: 1px inset rgba(160, 160, 160, 1);
        }
        ul > li > input,
        .dropdown-tree.react-dropdown-tree-select {
          font-size: 20px;
        }
      `}</style>
    </div>
  ))
);

export default ItemEditor;
