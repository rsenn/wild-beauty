import React, { useState } from "react";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";
import { observable, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { AddItemBar } from "../views/addItemBar.js";
import { EditableField } from "../simple/editableField.js";
import { Element, Timer } from "../../utils/dom.js";

import SortableTree from "react-sortable-tree";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../../static/css/react-dropdown-tree-select.css";

import "react-sortable-tree/style.css"; // This only needs to be imported once in your app

export const ItemEditor = inject("rootStore")(
  observer(({ rootStore, tree, makeTreeSelEvent }) => {
    console.log("Tree data: ", tree);

    return (
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
        <div className={"item-fields"}>
          <DropdownTreeSelect
            data={[tree]}
            onChange={obj => {
              console.log("Tree value: ", obj);
              rootStore.state.parent_id = obj.value;
              makeTreeSelEvent("change")(obj);
            }}
            onNodeToggle={makeTreeSelEvent("node-toggle")}
            onFocus={makeTreeSelEvent("focus")}
            onBlur={makeTreeSelEvent("blur")}
            className={"dropdown-tree"}
            mode={"radioSelect"}
            texts={{ placeholder: "parent item" }}
          />
          <SortableTree treeData={tree} />
          {rootStore.entries.map(field => (
            <EditableField
              options={rootStore.fieldNames}
              multiline={!!field.multiline}
              hasDraft={false}
              className={"editable-field"}
              name={field.type}
              value={field.value}
              onNameChanged={newName => {
                field.multiline = String(newName).toLowerCase() == "text";
                field.type = newName;
              }}
              onValueChanged={newVal => {
                field.value = newVal;
              }}
              onCreateName={name => {
                console.log("onCreateName: ", name);
                if(typeof name == "string" && name.length > 0) {
                  name = name.toLowerCase();
                  rootStore.fields.push(name);
                  field.type = name;
                }
              }}
            />
          ))}
          <AddItemBar
            onAdd={() => {
              let obj = observable({ type: null, value: "" });
              rootStore.entries.push(obj);
              Timer.once(100, () => {
                let a = [...dom.Element.findAll("img").filter(i => /edit/.test(i.src))];
                let button = a[a.length - 1].parentElement;
                console.log("Button: ", button);
                if(button && button.click) button.click();
                let inputs = Util.array([...dom.Element.findAll("input", button.parentElement)]);
                console.log("inputs:", inputs);
                inputs[0].focus();
              });
            }}
          >
            <button onClick={rootStore.saveItem.bind(rootStore)} className={"save"}>
              <img src={"/static/img/icon-save.svg"} />
            </button>
          </AddItemBar>
        </div>
        <style jsx global>{`
          .content-edit {
            position: relative;
            padding: 0px 10px 60px 10px;
          }
          .item-entry {
            margin: 10px;
            max-width: 50vw;
          }
          .item-fields {
            width: 96vw;
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
          input {
            border-radius: 0;
          }
          button {
            -webkit-appearance: none;
            border: 1px outset #555555;
            border-radius: 5px;
            -webkit-border-radius: 5px;
            background: linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
            background: -webkit-linear-gradient(top, #f0f0f0 0%, #dcdcdc 44%, #dcdcdc 44%, #c8c8c8 63%, #8d8d8d 100%);
          }
          button:active {
            border: 1px inset #555555;
          }
          button.save,
          button.button-add {
            margin: 1px;
            width: 77px;
            height: 38px;
          }
          button.icon {
            margin: 1px;
            width: 38px;
            height: 38px;
          }
          button.save {
            position: absolute;
            right: 0px;
            bottom: 0px;
          }
          ul.tag-list > li.tag-item {
            transform: translateY(-7px);
          }
        `}</style>
      </div>
    );
  })
);

export default ItemEditor;
