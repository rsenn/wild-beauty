import CreatableSelect, { makeCreatableSelect } from "react-select/creatable";
import classNames from "classnames";
import { useEditableState } from "react-editable-hooks";
import { trkl } from "../../utils/trkl.js";

export const EditableField = ({ options, key, className, style, multiline = false, wrapFlex = true, value, onValueChanged }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: key || "editable"
  });

  const lines = value.split(/\n/g).length;
  const lineStyle = multiline ? { height: `${lines}em`, whiteSpace: "pre" } : {};
  const ref = trkl();
  const [focus, setFocus] = React.useState(false);
  const [name, setName] = React.useState("");

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
        className={"icon"}
      >
        <img src={"static/img/icon-apply.svg"} />
      </button>
      <button
        onClick={e => {
          setFocus(false);
          onEditCancel(e);
        }}
        className={"icon"}
      >
        <img src={"static/img/icon-cancel.svg"} />
      </button>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <div className={classNames("content", className + "-content")} ref={ref} style={lineStyle}>
        {value}
      </div>
      <button onClick={onEditBegin} className={"icon"}>
        <img src={"static/img/icon-edit.svg"} />{" "}
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

  return (
    <div className={classNames(className, "editable-field")} style={style}>
      {isEditing ? (
        <CreatableSelect
          className={classNames("editable-field-name", className + "-name")}
          value={name}
          onChange={choice => {
            console.log("name change: ", choice.label);
            setName(choice);
          }}
          options={options}
        />
      ) : (
        <div className={classNames("editable-field-name", "editable-field-name-noedit", className + "-name")}>
          <div className={classNames("editable-field-name-inner", "editable-field-name-noedit-inner")}> {name.label}</div>
        </div>
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
        .editable-field-name {
          width: 200px;
          flex: 0 0 auto;
        }
        .content.editable-field-content {
          flex: 1 1 auto;
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
          justify-content: center;
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
          border: 1px inset rgba(160, 160, 160, 1);
        }
        .editable-field {
          width: 100%;
          margin: 2px 0;
        }
        .editable-field > button {
          box-sizing: border-box;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
        }
      `}</style>
    </div>
  );
};

export default EditableField;
