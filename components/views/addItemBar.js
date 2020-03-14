import React, { useState } from "react";

export const AddItemBar = ({ onAdd, ...props }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"add-item-bar"}>
      <button className={"button-add"} onClick={onAdd}>
        <svg height="32" width="32" xmlns="http://www.w3.org/2000/svg">
          <defs />
          <ellipse cx="381.549" cy="-159.087" rx="51.831" ry="11.24" />
          <path d="M14.996 23.38c-.398-1.009-.388-2.13-.46-3.201l-.093-2.506c-1.757-.122-3.526-.134-5.271-.378-.728-.027-1.11-.814-.938-1.457a1.58 1.58 0 011.559-1.257c1.602-.103 3.21-.042 4.816-.059.029-1.659-.083-3.327.12-4.978.016-.774.65-1.503 1.467-1.313.88.043 1.22 1.01 1.293 1.752.176 1.506.08 3.026.105 4.54 1.58.026 3.17-.077 4.744.105.746.1 1.598.791 1.453 1.607-.113.9-.94 1.35-1.785 1.254-1.47.034-2.941.012-4.412.018-.033 1.828.124 3.683-.275 5.481-.288.913-1.727 1.074-2.323.392z" />
          <circle cx="16" cy="16" fill="none" r="12.672" stroke="#000" strokeLinecap="round" strokeWidth="0.5" />
        </svg>
      </button>
      {props.children}
      <style jsx>{`
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
