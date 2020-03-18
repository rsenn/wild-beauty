import React, { useState } from "react";
import CreatableSelect from "react-select/creatable";
import classNames from "classnames";
import { useEditableState } from "react-editable-hooks";
import { trkl } from "../../lib/trkl.js";
import Util from "../../lib/util.js";
import { WrapIf } from "./wrapIf.js";
import { IconApply, IconCancel, IconEdit } from "./icons.js";
import { toJS } from "mobx";

export const FieldLabel = ({ style = { marginRight: "0px" }, children, className, ...props }) => (
  <div className={classNames("editable-field-name", "editable-field-name-noedit", className + "-name")}>
    <div className={classNames("editable-field-name-inner", "editable-field-name-noedit-inner", "hright", "vcenter")} style={style}>
      {children}
    </div>
  </div>
);

export const EditableField = ({ options, storageKey, className, style, multiline = false, wrapFlex = true, onCreateName, onNameChanged, value = "", onValueChanged, onFocus, onBlur, ...props }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: storageKey || "editable"
  });

  if(/\n/.test(value)) multiline = true;

  const lines = 10; //value.split(/\n/g).length;
  const lineStyle = multiline ? { height: `${lines}em`, whiteSpace: "pre" } : {};
  const ref = trkl();
  const [focus, setFocus] = React.useState(false);
  const [name, setName] = React.useState(props.name);
  const [newValue, setNewValue] = React.useState(value);
  const [background, setBackground] = React.useState("white");
  const handleKeyDown = e => {
    const val = e.target.value;
    const nativeEvent = e.nativeEvent || e;

    console.log("handleKeyDown ", nativeEvent);

    if(nativeEvent.key == "Enter") onEditConfirm(e);
    else if(nativeEvent.key.startsWith("Esc")) onEditCancel(e);
  };

  const changeName = opt => {
    setName(opt.name);
    multiline = String(opt.type).toLowerCase() == "text";
    onNameChanged(opt.label);
  };

  const changeValue = value => {
    setEditValue(value);
  };

  const handleBlur = e => {
    const val = e.target.value;
    const nativeEvent = e.nativeEvent || e;

    console.log("blur event:", nativeEvent);
    setNewValue(val);
    if(val != value) {
      setBackground("#ff8");
    } else {
      setBackground("#fff");
      //setFocus(false);
      //onEditCancel(e);
    }
    onBlur(e);
  };
  const handleFocus = e => {
    const val = e.target.value;
    setBackground("#fff");
    setFocus(true);
    onFocus(e);
  };

  let content = isEditing ? (
    <React.Fragment>
      {multiline || String(name).toLowerCase() == "text" ? (
        <textarea
          style={{ background }}
          className={classNames("content", className + "-content")}
          rows={lines}
          style={lineStyle}
          value={editValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={e => {
            changeValue(e.target.value);
          }}
          ref={input => {
            if(!focus) {
              if(input) input.focus();
              setFocus(true);
            }
          }}
        />
      ) : (
        <input
          style={{ background }}
          className={classNames("content", className + "-content", "vcenter")}
          name={name}
          value={editValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={e => changeValue(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={input => {
            if(!focus) {
              if(input) input.focus();
              setFocus(true);
            }
          }}
        />
      )}
      <button
        onClick={e => {
          setFocus(false);
          onEditConfirm(e);
        }}
        className={"icon"}
      >
        <IconApply />
      </button>
      <button
        onClick={e => {
          setFocus(false);
          onEditCancel(e);
        }}
        className={"icon"}
      >
        <IconCancel />
      </button>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <div className={classNames("content", className + "-content", "vcenter")} ref={ref} style={lineStyle}>
        <WrapIf cond={multiline} container={"pre"}>
          <span className={classNames(className + "-span")} style={{ margin: "auto 2px" }}>
            {value}
          </span>
        </WrapIf>
      </div>
      <button onClick={onEditBegin} className={"icon"}>
        <IconEdit />{" "}
      </button>
    </React.Fragment>
  );
  /*
  if(wrapFlex)
    content = (
      <div className={classNames(className, "editable-field")} style={style}>
        {content}
      </div>
    );*/
  const selection = Util.find(options, name, "name");
  const selectOptions = toJS(options);

  //console.log("EditableField.render ", { selection, name, multiline, value });

  return (
    <div className={classNames(className, "editable-field")} style={style} {...props}>
      {isEditing ? (
        <CreatableSelect
          createOptionPosition={"first"}
          allowCreateWhileLoading
          isValidNewOption={value => true}
          onCreateOption={onCreateName}
          formatCreateLabel={value => {
            //console.log("formatCreateLabel", value);
            return typeof value == "string" ? Util.ucfirst(value) : "";
          }}
          className={classNames("editable-field-name", "choose-field-name", className + "-name")}
          value={selection}
          onChange={choice => {
            console.log("name change: ", choice.name || choice.label);
            changeName(choice);
          }}
          options={selectOptions}
        />
      ) : (
        <FieldLabel>{selection.label}</FieldLabel>
      )}

      {content}
      <style jsx global>{`
        div.editable-field {
          display: flex;
          flex-flow: row nowrap;
          justify-content: stretch;
          align-items: flex-start;
          font-size: 20px;
        }
        div.editable-field > .content {
          flex: 1 1 auto;
        }
        div.editable-field > .content {
          font-family: Fixed;
        }
        input.content,
        textarea.content {
          border: 1px solid rgba(204, 204, 204, 1);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 1);
        }
        input.content:focus,
        textarea.content:focus {
          border: 2px solid #2684ff;
        }
        textarea {
          margin: 0;
        }

        .editable-field-content {
          vertical-align: middle;
          line-height: 100%;
          padding: auto 2px;
        }
        .editable-field-name {
          /*  border: 1px dotted black;*/
          line-height: 100%;
          vertical-align: middle;
          max-height: 20px;
          margin-top: 4px;
        }
        .editable-field-span {
          margin: auto 2px;
        }
        .editable-field-name-inner {
          margin: auto 0 auto auto;
        }
        div.content,
        span.content,
        input.content,
        textarea.content {
          align-self: stretch;
          flex: 1 1 auto;
          padding: 2px;
          min-height: 28px;
        }
        div.content,
        span.content {
          border: 1px dashed black;
          margin: 0 2px;
        }
        div.editable-field > .content {
          text-align: left;
          vertical-align: middle;
        }
        div.editable-field {
          display: flex;
          flex-flow: row nowrap;
          justify-content: stretch;
          align-items: stretch;
        }
        .choose-field-name {
          position: relative;
          top: -3px;
        }
        .choose-field-name {
          min-width: 110px;
          flex: 0 0 auto;
        }
        .editable-field-name-noedit {
          min-width: 64px;
        }
        .editable-field-name {
          flex: 0 0 auto;
        }
        .content.editable-field-content {
          flex: 1 1 auto;
          margin: 2px 4px 2px 0px;
        }
        .content.editable-field-content > pre {
          margin: 0 2px;
        }
        .editable-field-content {
          background-color: rgba(255, 255, 255, 0.6);
          font-size: 20px;
        }
        .editable-field-name,
        .editable-field-content {
          min-height: 34px;
          font-size: 20px;
        }
        div.editable-field-content {
          text-align: left;
          border: 1px dashed black;
        }
        div.editable-field-name,
        div.editable-field-content {
          display: flex;
          justify-content: flex-start;
          align-content: center;
          flex-direction: column;
        }
        .editable-field-name {
          align-content: flex-end;
          text-align: right;
          padding: 0 8px 0 0;
          font-weight: 100;
        }

        div.editable-field-content {
          margin: 0 2px;
        }
        .editable-field-content {
          align-content: flex-start;
        }
        input.editable-field-content {
          font-family: Fixed;
          font-size: 20px;
        }
        .editable-field {
          width: 100%;
          margin: 2px 0;
        }
        button.icon {
          box-sizing: border-box;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
        }
        button.icon:hover {
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.6);
        }
        button.icon:active {
          box-shadow: none;
        }
        #rdts1 {
          width: 100%;
        }
        #rdts1 > div {
          width: 100%;
        }
        #rdts1_trigger {
          width: 100%;
        }
        #rdts1_trigger > ul {
          width: 100%;
        }
        ul.tag-list,
        li.tag-item {
          display: block;
        }
        li.tag-item {
          position: relative;
          top: 6px;
          left: 2px;
          text-align: left;
        }
        #rdts1-0-0-0-0-0_tag {
          display: block;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default EditableField;
