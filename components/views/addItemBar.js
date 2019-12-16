import React, { useState } from "react";
import classNames from "classnames";

export const IconAdd = props => (
  <img src={'static/img/icon-add.svg'} />
  /*<svg height="32" width="32" viewBox="0 0 45.336 45.336" xmlns="http://www.w3.org/2000/svg">
    <defs />
    <defs />
    <g transform="translate(1.662 1.658)">
      <path d="M18.391 23.624H7.931v-5.23h10.46V7.935h5.23v10.46H34.08v5.229H23.62v10.459h-5.229z" fill="#00d400" fontFamily="Fixed" fontSize="67.917" strokeWidth="1.592" />
      <circle cx="21.006" cy="21.01" fill="none" r="18.89" stroke="#555" strokeWidth="4.233" />
    </g>
  </svg>*/
);

export const AddItemBar = ({ onAdd, ...props }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"add-item-bar"}>
      <button className={"button-add"} onClick={onAdd}>
        <IconAdd />
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