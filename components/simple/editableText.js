import React, { useState } from "react";
import { useEditableState } from "react-editable-hooks";
import classNames from "classnames";
import { trkl } from "../../lib/trkl.js";

export const EditableText = ({ className, style, multiline = false, wrapFlex = true, value, onValueChanged }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: "editable"
  });

  const lines = value.split(/\n/g).length;
  const lineStyle = multiline ? { height: `${lines}em`, whiteSpace: "pre" } : {};
  const ref = trkl();
  const [focus, setFocus] = React.useState(false);

  let content = isEditing ? (
    <React.Fragment>
      {multiline ? (
        <textarea
          className={classNames("content", className + "-content")}
          rows={lines}
          style={lineStyle}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          ref={input => {
            if(!focus) {
              if(input) input.focus();
              setFocus(true);
            }
          }}
        />
      ) : (
        <input
          className={classNames("content", className + "-content")}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
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
      >
        <img src={"/static/img/icon-apply.svg"} />
      </button>
      <button
        onClick={e => {
          setFocus(false);
          onEditCancel(e);
        }}
      >
        <img src={"/static/img/icon-cancel.svg"} />
      </button>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <div className={classNames("content", className + "-content")} ref={ref} style={lineStyle}>
        {value}
      </div>
      <button onClick={onEditBegin}>
        <img src={"/static/img/icon-edit.svg"} />
      </button>
    </React.Fragment>
  );

  if(wrapFlex) {
    content = (
      <div className={classNames(className, "editable-text")} style={style}>
        {content}
      </div>
    );
  }

  return (
    <React.Fragment>
      {content}

      <style jsx>{`
        div.editable-text {
          display: flex;
          flex-flow: row nowrap;
          justify-content: stretch;
          align-items: flex-start;
        }
        div.editable-text > .content {
          flex: 1 1 auto;
        }
        div.editable-text > button {
          flex: 0 1 auto;
        }
        div.editable-text > .content {
          font-family: Fixed;
          font-size: 15px;
        }
        input.content,
        textarea.content {
          border: 1px inset rgba(160, 160, 160, 1);
          background-color: rgba(255, 255, 255, 0.6);
        }
        div.content,
        span.content,
        input.content,
        textarea.content {
          align-self: stretch;
          flex: 1 1 auto;
          padding: 2px;
          min-height: 15px;

          -webkit-user-select: text;
          user-select: text;
        }
        div.content,
        span.content {
          border: 1px dashed black;
        }
        div.editable-text > .content {
          text-align: left;
          vertical-align: middle;
          margin: auto;

          -webkit-user-select: text;
          user-select: text;
        }
      `}</style>
    </React.Fragment>
  );
};

export default EditableText;
