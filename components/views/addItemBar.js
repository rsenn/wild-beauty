import React, { useState } from "react";

export const AddItemBar = ({ onAdd, ...props }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"add-item-bar"}>
      <button className={"button-add"} onClick={onAdd}>
        <img src={"static/img/icon-editbox-add.svg"} width={64} height={32} />
      </button>
      {props.children}
      <style jsx>{`
        .button-add {
        }
        .add-item-bar {
          position: relative;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default AddItemBar;
