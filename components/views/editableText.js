import React, { useState } from "react";
import { useEditableState } from "react-editable-hooks";

export const EditableText = ({ value, onValueChanged }) => {
  const { onEditBegin, onEditConfirm, onEditCancel, isEditing, editValue, setEditValue, useDraft, hasDraft } = useEditableState({
    value,
    onValueChanged,
    localStorageKey: "editable"
  });

  return isEditing ? (
    <React.Fragment>
      <input className="content" value={editValue} onChange={e => setEditValue(e.target.value)} />
      <button onClick={onEditConfirm}>Confirm</button>
      <button onClick={onEditCancel}>Cancel</button>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <span>{value}</span>
      <button onClick={onEditBegin}>Edit</button>
      {hasDraft ? <button onClick={useDraft}>Load draft</button> : null}
    </React.Fragment>
  );
};

export default EditableText;
