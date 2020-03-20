import React, { useState } from "react";

export const DraggableList = ({ children, itemClassName, ...props }) => {
  const [list, setList] = useState(children);
  const [draggedItem, setDraggedItem] = useState(null);

  function onDragStartHandle(e, index) {
    setDraggedItem(list[index]);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  }

  function onDragOverHandle(index) {
    const draggedOverItem = list[index];
    if(draggedOverItem === draggedItem) {
      return;
    }
    const items = list.filter(item => item !== draggedItem);
    items.splice(index, 0, draggedItem);
    setList(items);
  }

  return (
    <ul {...props}>
      {list.map((item, index) => {
        return (
          <li key={index} onDragOver={e => onDragOverHandle(index)} className={itemClassName}>
            <div draggable onDragStart={e => onDragStartHandle(e, index)}>
              {children}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default DraggableList;
