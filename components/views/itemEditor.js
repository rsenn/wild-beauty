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

      <button onClick={rootStore.saveItem} className={"save"}>
        {" "}
        <img src={"static/img/icon-save.svg"} />{" "}
      </button>

      <style jsx global>{`
        .content-edit {
          position: relative;
          width: 80vw;
          min-height: 80vh;
          padding: 0px;
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
                  .item-box-size {
            border: 1px solid black;
            box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.75);
            box-sizing: border-box;
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

        ul > li > input,
        .dropdown-tree.react-dropdown-tree-select {
          font-size: 20px;
        }
        button.save {
          position: absolute;
          right: 0px;
          bottom: 0px;
        }
      `}</style>
    </div>
  ))
);

export default ItemEditor;
