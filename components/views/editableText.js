import React, { useState } from "react";
import { useEditableState } from "react-editable-hooks";
import classNames from "classnames";
import { useRef } from 'react';
import { trkl } from "../../utils/trkl.js";
 
export const EditableText = ({ className, style, multiline = false, value, onValueChanged }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: "editable"
  });

  const lines = value.split(/\n/g).length;
  const lineStyle = multiline ? { height: `${lines}em`, whiteSpace: "pre" } : {};
  const ref = trkl();
/*
 useDoubleClick({
    onSingleClick: e => {
      console.log(e, 'single click');
    },
    onDoubleClick: onEditBegin,
    ref,
    latency: 250
  });
*/
  return (
    <div className={classNames(className, "editable-text")} style={style}>
      {isEditing ? (
        <React.Fragment>
          {multiline ? (
            <textarea className="content" rows={lines} style={lineStyle} value={editValue} onChange={e => setEditValue(e.target.value)}></textarea>
          ) : (
            <input className="content" value={editValue} onChange={e => setEditValue(e.target.value)} />
          )}
          <button onClick={onEditConfirm}>Confirm</button>
          <button onClick={onEditCancel}>Cancel</button>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="content" ref={ref} style={lineStyle}>
            {value}
          </div>
          <button onClick={onEditBegin}>Edit</button>
          {hasDraft ? <button onClick={useDraft}>Load draft</button> : null}
        </React.Fragment>
      )}
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
        }
        div.content,
        span.content {
          border: 1px dashed black;
        }

        div.editable-text > .content {
          text-align: left;
          vertical-align: middle;
          margin: auto;
        }
      `}</style>
    </div>
  );
};

export default EditableText;
