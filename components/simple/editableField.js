import CreatableSelect from "react-select/creatable";
import classNames from "classnames";
import { useEditableState } from "react-editable-hooks";
import { trkl } from "../../lib/trkl.js";
import Util from "../../lib/util.js";
import { WrapIf } from "./wrapIf.js";

export const EditableField = ({ options, key, className, style, multiline = false, wrapFlex = true, onCreateName, onNameChanged, value, onValueChanged, onFocus, onBlur, ...props }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: key || "editable"
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
    const { nativeEvent } = e;

    console.log("handleKeyDown ", nativeEvent);

    if(nativeEvent.key == "Enter") onEditConfirm(e);
    else if(nativeEvent.key.startsWith("Esc")) onEditCancel(e);
  };
  const handleBlur = e => {
    const val = e.target.value;
    setNewValue(val);
    if(val != value) {
      setBackground("#ff8");
    } else {
      setBackground("#fff");
      setFocus(false);
      onEditCancel(e);
    }
    onBlur(e);
  };
  const handleFocus = e => {
    const val = e.target.value;
    setBackground("#fff");
    setFocus(true);
    onFocus(e);
  };
  const changeName = opt => {
    setName(opt.name);
    multiline = String(opt.type).toLowerCase() == "text";
    onNameChanged(opt.label);
  };

  const changeValue = value => {
    setEditValue(value);
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
          onBlur={handleBlur}
          onFocus={handleFocus}
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
          className={classNames("content", className + "-content")}
          name={name}
          value={editValue}
          onBlur={handleBlur}
          onFocus={handleFocus}
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
        <img src={"/static/img/icon-apply.svg"} />
      </button>
      <button
        onClick={e => {
          setFocus(false);
          onEditCancel(e);
        }}
        className={"icon"}
      >
        <img src={"/static/img/icon-cancel.svg"} />
      </button>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <div className={classNames("content", className + "-content")} ref={ref} style={lineStyle}>
        <WrapIf cond={multiline} container={"pre"}>
          {value}
        </WrapIf>
      </div>
      <button onClick={onEditBegin} className={"icon"}>
  <svg height="32" width="32" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg">
  <defs/>
  <defs>
    <linearGradient id="icon-edit_svg__b">
      <stop offset="0" stopColor="#fca"/>
      <stop offset="1" stopColor="#d45500"/>
    </linearGradient>
    <linearGradient id="icon-edit_svg__a">
      <stop offset="0" stopColor="red"/>
      <stop offset="1" stopColor="#a00"/>
    </linearGradient>
    <linearGradient href="#icon-edit_svg__a" id="icon-edit_svg__d" gradientUnits="userSpaceOnUse" x1="9.886" x2="13.636" y1="3.71" y2="3.71"/>
    <linearGradient href="#icon-edit_svg__b" id="icon-edit_svg__e" gradientUnits="userSpaceOnUse" x1="3.431" x2="5.801" y1="11.182" y2="12.305"/>
  </defs>
  <g transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)">
    <path d="M5.096 11.141l-.765-.766 6.112-6.112.765.766zm.723.723L3.608 9.652 9.72 3.541l2.211 2.211zm0 0l-.723-.723 6.113-6.112.722.723zm-1.488-1.489l-.723-.723L9.72 3.541l.723.722zm-1.592 2.07l.287.292-.632.62-.287-.294zm-.118.406l2.85-.782L3.404 10zm10.735-9.56l-1.175-1.176c-.286-.287-.77-.266-1.081.046L9.997 3.264l2.21 2.21 1.104-1.102c.31-.312.331-.796.045-1.082zM5.82 11.864L3.608 9.652 9.72 3.541l2.211 2.211z" fill="none" stroke="#000" strokeWidth=".156"/>
  </g>
  <path d="M4.943 12.779l-2.631-2.631 7.272-7.271 2.63 2.63z" fill="#fc0"/>
  <path d="M13.356 3.29l-1.175-1.175c-.286-.287-.77-.266-1.081.046L9.997 3.264l2.21 2.21 1.104-1.102c.31-.312.331-.796.045-1.082z" fill="url(#icon-edit_svg__d)" stroke="#000" strokeWidth=".156" transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)"/>
  <path d="M2.621 12.851l2.85-.782L3.404 10z" fill="url(#icon-edit_svg__e)" stroke="#000" strokeWidth=".156" transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)"/>
  <path d="M1.278 13.469l.341.349-.751.736-.341-.349z" fill="#241c1c"/>
  <path d="M3.172 11.008l-.86-.86 7.272-7.271.86.86z" fill="#f3c300"/>
  <path d="M4.943 12.778l-.86-.86 7.272-7.27.86.86z" fill="#daaf00"/>
  <path d="M4.083 11.919l-.911-.911 7.272-7.272.91.911zm.86.86l-2.631-2.631 7.272-7.271 2.63 2.63z" fill="none" stroke="#000" strokeWidth=".18559319999999999"/>
</svg>



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

  console.log("EditableField.render ", { name, multiline, value, options });
  return (
    <div className={classNames(className, "editable-field")} style={style}>
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
          className={classNames("editable-field-name", className + "-name")}
          value={selection}
          onChange={choice => {
            console.log("name change: ", choice.name || choice.title);
            changeName(choice);
          }}
          options={options}
        />
      ) : (
        <div className={classNames("editable-field-name", "editable-field-name-noedit", className + "-name")}>
          <div className={classNames("editable-field-name-inner", "editable-field-name-noedit-inner")}>{selection.label}</div>
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
          width: 120px;
          flex: 0 0 auto;
        }
        .content.editable-field-content {
          flex: 1 1 auto;
          margin: 0 2px;
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
      `}</style>
    </div>
  );
};

export default EditableField;
