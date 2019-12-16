import CreatableSelect, { makeCreatableSelect } from "react-select/creatable";
import { EditableText } from "./editableText.js";
import classNames from "classnames";

export const EditableField = ({ options, className, style, multiline, value, onValueChanged }) => (
  <div className={classNames(className, "editable-field")}>
    <CreatableSelect className={classNames("editable-field-name", className + "-name")} options={options} />
    <EditableText className={classNames("editable-field-value", className + "-value")} wrapFlex={false} style={style} multiline={multiline} value={value} onValueChanged={onValueChanged} />
    <style jsx global>{`
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
      .editable-field-value {
        flex: 1 1 auto;
        margin: 0 2px;
      }
    `}</style>
  </div>
);

export default EditableField;
