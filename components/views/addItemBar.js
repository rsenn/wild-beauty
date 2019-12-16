import React, { useState } from "react";
import classNames from "classnames";

export const AddItemBar = ({ onAdd, ...props }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"add-item-bar"}>
      <button className={"button-add"} onClick={onAdd}>
        <img src={"static/img/icon-plus.svg"} />
      </button>
      <style jsx>{`
        .add-item-bar {
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
        }
      `}</style>
    </div>
  );
};

export default AddItemBar;
