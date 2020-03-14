import React, { useState } from "react";
import { SizedAspectRatioBox } from "../simple/aspectBox.js";
import { observable, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { AddItemBar } from "../views/addItemBar.js";
import { EditableField, FieldLabel } from "../simple/editableField.js";
import { Element, Timer } from "../../lib/dom.js";
import { makeItemToOption, findInTree } from "../../stores/functions.js";

//import SortableTree from "react-sortable-tree";

import DropdownTreeSelect from "react-dropdown-tree-select";
import "../../static/css/react-dropdown-tree-select.css";

//import "react-sortable-tree/style.css"; // once app

export const ItemEditor = inject(
  "rootStore",
  "editorStore"
)(
  observer(({ rootStore, editorStore, image, makeTreeSelEvent, ...props }) => {
    let img = image || rootStore.currentPhoto;

    //if(img === null) return undefined;

    if(img && img.landscape === undefined) img.landscape = img.width >= img.height;
    let entries = toJS(editorStore.fields);
    let fields = editorStore.getFields();

    const [parentId, setParentId] = useState(-1);

    const rootId = rootStore.rootItemId;

    const items = rootStore.items;

    let tree = rootStore.getItem(rootId, makeItemToOption(parentId));
    tree = toJS(tree);
    tree = tree || [];

    console.log("ItemEditor.render ", { /*items, */tree, rootId, img, entries });

    return (
      <div className={"content-edit"} {...props}>
        <div className={"item-photo"}>
          <div className={"item-entry"} style={img ? { width: img.width > img.height ? `${(img.height * 100) / img.width}%` : "100%" } : {}}>
            <SizedAspectRatioBox className={"item-box"}>
              {img ? (
                <img
                  id={`image-${img.id}`}
                  className={"inner-image"}
                  src={`/api/photo/get/${img.id}.jpg`}
                  width={img.width}
                  height={img.height}
                  orientation={img.landscape ? "landscape" : "portrait"}
                  style={{
                    width: img.landscape ? `${(img.width * 100) / img.height}%` : "100%",
                    height: img.landscape ? "100%" : "auto"
                  }}
                />
              ) : (
                <span>No image!</span>
              )}
            </SizedAspectRatioBox>
          </div>
        </div>
        <div className={"item-fields"}>
          <div className={"editable-field"}>
            <FieldLabel>Parent item</FieldLabel>
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
              texts={{ placeholder: "Select" }}
            />
          </div>

          {fields.map((field, i) => {
            let { name, label, type = "string", multiline = false } = field;
            // console.log("field: ", {i,field});

            return (
              <EditableField
                key={i}
                options={editorStore.getFields()}
                multiline={!!multiline}
                className={"editable-field"}
                name={name}
                value={editorStore.getValue(name)}
                onNameChanged={newName => {
                  multiline = String(newName).toLowerCase() == "text";
                  type = newName;
                }}
                onValueChanged={newVal => {
                  console.log(`value of ${name} changed: ${newVal}`);
                  editorStore.setField(name, newVal);
                }}
                onCreateName={name => {
                  console.log("onCreateName: ", name);
                  if(typeof name == "string" && name.length > 0) {
                    name = name.toLowerCase();
                    editorStore.addField(name, "string");
                    type = name;
                  }
                }}
                onFocus={e => console.log("got focus: ", e.target)}
                onBlur={e => console.log("lost  focus: ", e.target)}
              />
            );
          })}
          <AddItemBar
            onAdd={event => {
              console.log("Add item:", event);
              let obj = observable({ type: null, value: "" });
              if(typeof entries == "object" && entries && entries.push !== undefined) entries.push(obj);
              const add = () => {
                /*    let editor = Element.find(".content-edit");
                let a = [...Element.findAll("button", editor)].filter(b => !b.classList.contains("save"));
                let button = a[a.length - 1] ? a[a.length - 1] : null;
                console.log("Button: ", button);
                if(button) {
                  if(button.click) button.click();
                  let inputs = Util.array([...Element.findAll("input", editor)]);
                  console.log("inputs:", inputs);
                  inputs[0].focus();
                }*/
              };
              add();
            }}
          >
            <button
              onClick={e => {
                rootStore.saveItem(e, response => {
                  let insertId = response.data.result[0].id;
                  rootStore.addToast(`Saved item (Id: ${insertId})`);
                });
              }}
              className={"save"}
            >
              <img src={"/static/img/action-save-new.svg"} />
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
