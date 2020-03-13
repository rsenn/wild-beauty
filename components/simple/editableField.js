import CreatableSelect from "react-select/creatable";
import classNames from "classnames";
import { useEditableState } from "react-editable-hooks";
import { trkl } from "../../lib/trkl.js";
import Util from "../../lib/util.js";
import { WrapIf } from "./wrapIf.js";

export const FieldLabel = ({ style = {  marginRight: '0px' }, children, className, ...props }) => (
        <div className={classNames("editable-field-name", "editable-field-name-noedit", className + "-name")}>
          <div className={classNames("editable-field-name-inner", "editable-field-name-noedit-inner", "hright", "vcenter")} style={style}>
            {children}
          </div>
        </div>);

export const IconApply = ({ style = { height: "100%", width: "auto" }, ...props }) => (
  <svg style={style} height="32" width="32" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <defs />
    <defs>
      <linearGradient id="icon-apply_svg__linearGradient1747" gradientUnits="userSpaceOnUse" x1="12.265" x2="-1.147" y1="1.175" y2="3.481">
        <stop offset="0" stopColor="#95ff00" />
        <stop offset="1" stopColor="#68d400" stopOpacity=".616" />
      </linearGradient>
      <mask id="icon-apply_svg__mask1737" maskUnits="userSpaceOnUse">
        <path d="M.136.271h15.458v15.932H.136z" fill="#fff" stroke="red" strokeLinecap="round" strokeWidth=".167" />
      </mask>
    </defs>
        <g transform=" translate(8, 8)">
    <g transform="translate(-7.338,-7.747) scale(0.9,0.9)">
    <g fill="url(#icon-apply_svg__linearGradient1747)" stroke="#170000" strokeWidth=".125" mask="url(#icon-apply_svg__mask1737)">
      <path d="M13.133 2.772a.768.768 0 00-.3.001 1.01 1.01 0 00-.562.344l-6.28 7.188-2.25-2.25c-.377-.377-1.062-.377-1.438 0-.377.376-.377 1.06 0 1.437l3 3 .78.75.688-.813 7-8c.497-.54.035-1.53-.638-1.658zm-18.184 16.46h24.813v-.5H18.59v-23.5h1.172v-.5H18.59v-.36h-.5v.36h-21.5v-.36h-.5v.36h-1.14v.5h1.14v23.5h-1.14zm1.64-.5v-23.5h21.5v23.5z" />
      <path d="M13.133 2.772a.768.768 0 00-.3.001 1.01 1.01 0 00-.562.344l-6.28 7.188-2.25-2.25c-.377-.377-1.062-.377-1.438 0-.377.376-.377 1.06 0 1.437l3 3 .78.75.688-.813 7-8c.497-.54.035-1.53-.638-1.658zm-18.184 16.46h24.812v-.5h-1.172v-23.5h1.172v-.5h-1.172v-.36h-.5v.36h-21.5v-.36h-.5v.36h-1.14v.5h1.14v23.5h-1.14zm1.64-.5v-23.5h21.5v23.5z" />
    </g></g></g>
  </svg>
);

export const IconCancel = ({ style = { height: "100%", width: "auto" }, ...props }) => (
  <svg style={style} height="32" width="32" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <defs />
    <defs>
      <linearGradient id="icon-cancel_svg__linearGradient2525" gradientUnits="userSpaceOnUse" x1="10.003" x2="4.782" y1="3.394" y2="11.733">
        <stop offset="0" stopColor="#ff2a2a" />
        <stop offset="1" stopColor="#a00" />
      </linearGradient>
      <mask id="icon-cancel_svg__mask1555" maskUnits="userSpaceOnUse">
        <path d="M-.068.068h16.542v16.271H-.068z" fill="#ffd5d5" stroke="red" strokeLinecap="round" strokeWidth=".167" />
      </mask>
    </defs>
        <g transform=" translate(8, 8)">
    <g transform="translate(-7.338,-7.747) scale(0.9,0.9)">
    <g mask="url(#icon-cancel_svg__mask1555)">
      <path
        d="M-3.661 19.186V-5.628m24 24.814V-5.628m-24.203 23.39H20.95m-24.814-22H20.95m-9.61 14.665a.635.635 0 00-.048-.391 1.153 1.153 0 00-.244-.316L8.755 7.427l2.283-2.284.01-.01c.183-.184.29-.442.289-.701l-.014-.009a1.11 1.11 0 00-.318-.682 1.11 1.11 0 00-.682-.318c-.132-.012-.268.003-.39.056s-.223.143-.317.237L7.323 6.009 5.03 3.716a1.045 1.045 0 00-.314-.235.803.803 0 00-.386-.055 1.11 1.11 0 00-.682.318 1.11 1.11 0 00-.318.682.81.81 0 00.056.39c.053.123.144.224.238.318l2.293 2.293L3.634 9.71a1.1 1.1 0 00-.242.321.82.82 0 00-.061.396 1.097 1.097 0 001 1 .81.81 0 00.39-.056c.122-.053.223-.143.317-.237l2.299-2.3 2.283 2.282c.096.096.199.189.322.245a.832.832 0 00.398.065c.257-.017.506-.13.687-.312.182-.182.295-.431.313-.688zm0 0a.635.635 0 00-.048-.391 1.153 1.153 0 00-.244-.316L8.755 7.427l2.283-2.284.01-.01c.183-.184.29-.442.289-.701l-.014-.009a1.11 1.11 0 00-.318-.682 1.11 1.11 0 00-.682-.318c-.132-.012-.268.003-.39.056s-.223.143-.317.237L7.323 6.009 5.03 3.716a1.045 1.045 0 00-.314-.235.803.803 0 00-.386-.055 1.11 1.11 0 00-.682.318 1.11 1.11 0 00-.318.682.81.81 0 00.056.39c.053.123.144.224.238.318l2.293 2.293L3.634 9.71a1.1 1.1 0 00-.242.321.82.82 0 00-.061.396 1.097 1.097 0 001 1 .81.81 0 00.39-.056c.122-.053.223-.143.317-.237l2.299-2.3 2.283 2.282c.096.096.199.189.322.245a.832.832 0 00.398.065c.257-.017.506-.13.687-.312.182-.182.295-.431.313-.688z"
        fill="red"
        stroke="red"
        strokeWidth=".5"
        transform="rotate(-90 7.95 7.373)"
      />
      <path
        d="M22.206 21.217H-7.692M22.206-7.701H-7.692m28.183 29.163V-8.436M-6.017 21.462V-8.436m17.67 11.578a.765.765 0 00-.472.059c-.146.068-.266.18-.38.294L8.038 6.258l-2.752-2.75-.012-.013a1.21 1.21 0 00-.844-.348l-.011.017a1.338 1.338 0 00-.822.383 1.338 1.338 0 00-.383.822.974.974 0 00.067.47c.064.147.173.268.286.382L6.33 7.983l-2.763 2.763a1.26 1.26 0 00-.283.378.967.967 0 00-.067.466c.027.307.165.604.383.822.218.218.515.356.822.383a.976.976 0 00.471-.068c.147-.064.27-.173.382-.287l2.763-2.762 2.751 2.75c.115.115.238.226.387.292a.989.989 0 00.477.073 1.322 1.322 0 001.205-1.205.977.977 0 00-.067-.47 1.272 1.272 0 00-.286-.381l-2.771-2.77 2.75-2.751a1.36 1.36 0 00.294-.389c.067-.149.09-.316.079-.479a1.309 1.309 0 00-.377-.828c-.219-.22-.519-.356-.828-.377zm0 0a.765.765 0 00-.472.059c-.146.068-.266.18-.38.294L8.038 6.258l-2.752-2.75-.012-.013a1.21 1.21 0 00-.844-.348l-.011.017a1.338 1.338 0 00-.822.383 1.338 1.338 0 00-.383.822.974.974 0 00.067.47c.064.147.173.268.286.382L6.33 7.983l-2.763 2.763a1.26 1.26 0 00-.283.378.967.967 0 00-.067.466c.027.307.165.604.383.822.218.218.515.356.822.383a.976.976 0 00.471-.068c.147-.064.27-.173.382-.287l2.763-2.762 2.751 2.75c.115.115.238.226.387.292a.989.989 0 00.477.073 1.322 1.322 0 001.205-1.205.977.977 0 00-.067-.47 1.272 1.272 0 00-.286-.381l-2.771-2.77 2.75-2.751a1.36 1.36 0 00.294-.389c.067-.149.09-.316.079-.479a1.309 1.309 0 00-.377-.828c-.219-.22-.519-.356-.828-.377z"
        fill="url(#icon-cancel_svg__linearGradient2525)"
        stroke="#0d0000"
        strokeWidth=".125"
      />
    </g></g></g>
  </svg>
);

export const IconEdit = ({ style = { height: "100%", width: "auto" }, ...props }) => (
  <svg style={style} height="32" width="32" viewBox="0 0 15 15">
    <defs />
    <defs>
      <linearGradient id="icon-edit-b">
        <stop offset="0" stopColor="#fca" />
        <stop offset="1" stopColor="#d45500" />
      </linearGradient>
      <linearGradient id="icon-edit-a">
        <stop offset="0" stopColor="red" />
        <stop offset="1" stopColor="#a00" />
      </linearGradient>
      <linearGradient href="#icon-edit-a" id="icon-edit-d" gradientUnits="userSpaceOnUse" x1="9.886" x2="13.636" y1="3.71" y2="3.71" />
      <linearGradient href="#icon-edit-b" id="icon-edit-e" gradientUnits="userSpaceOnUse" x1="3.431" x2="5.801" y1="11.182" y2="12.305" />
    </defs>
    <g transform=" translate(9, 9)">
    <g transform="translate(-7.338138282299042,-7.7471630573272705) scale(0.8,0.8)">
    <g transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)">
      <path
        d="M5.096 11.141l-.765-.766 6.112-6.112.765.766zm.723.723L3.608 9.652 9.72 3.541l2.211 2.211zm0 0l-.723-.723 6.113-6.112.722.723zm-1.488-1.489l-.723-.723L9.72 3.541l.723.722zm-1.592 2.07l.287.292-.632.62-.287-.294zm-.118.406l2.85-.782L3.404 10zm10.735-9.56l-1.175-1.176c-.286-.287-.77-.266-1.081.046L9.997 3.264l2.21 2.21 1.104-1.102c.31-.312.331-.796.045-1.082zM5.82 11.864L3.608 9.652 9.72 3.541l2.211 2.211z"
        fill="none"
        stroke="#000"
        strokeWidth=".156"
      />
    </g>
    <path d="M4.943 12.779l-2.631-2.631 7.272-7.271 2.63 2.63z" fill="#fc0" />
    <path d="M13.356 3.29l-1.175-1.175c-.286-.287-.77-.266-1.081.046L9.997 3.264l2.21 2.21 1.104-1.102c.31-.312.331-.796.045-1.082z" fill="url(#icon-edit-d)" stroke="#000" strokeWidth=".156" transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)" />
    <path d="M2.621 12.851l2.85-.782L3.404 10z" fill="url(#icon-edit-e)" stroke="#000" strokeWidth=".156" transform="matrix(1.1897 0 0 1.1897 -1.98 -1.336)" />
    <path d="M1.278 13.469l.341.349-.751.736-.341-.349z" fill="#241c1c" />
    <path d="M3.172 11.008l-.86-.86 7.272-7.271.86.86z" fill="#f3c300" />
    <path d="M4.943 12.778l-.86-.86 7.272-7.27.86.86z" fill="#daaf00" />
    <path d="M4.083 11.919l-.911-.911 7.272-7.272.91.911zm.86.86l-2.631-2.631 7.272-7.271 2.63 2.63z" fill="none" stroke="#000" strokeWidth=".18559319999999999" /></g>
</g>
  </svg>
);

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
          className={classNames("content", className + "-content", "vcenter")}
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
          <span classNames={classNames(className + "-span")} style={{ margin: 'auto 2px' }}>{value}</span>
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
      ) : <FieldLabel>{selection.label}</FieldLabel>
     }

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
