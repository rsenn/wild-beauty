import React from "react";
import { inject, observer } from "mobx-react";
import { toJS } from "mobx";
import { SizedAspectRatioBox } from "../simple/aspectBox.js";


export const ItemTile = inject("rootStore")(
  observer(({ rootStore, id, onPrev, onNext }) => {
    let { data, ... item } = rootStore.getItem(id);
    console.log("Item ID: ", id);
    console.log("Item: ", toJS(item));
    if(item) {
      if(!item.photos || !item.photos.length)
        item.photos = [
      {
        href: "/static/img/no-image.svg",
        width: 100,
        height: 100,
        id: -1
      }
      ];
    }
    data = JSON.parse(data);
    data = { ...item, ...data };
    console.log("ItemTile.render", data);

    // prettier-ignore
    return (
      <div className={"item-tile"}>
      {item && item.photos && item.photos.map
        ? item.photos.map(photo => (
          <div className={"item-image"}>
          <img
          src={photo.href || `/api/image/get/${photo.id}`}
          width={photo.width}
          height={photo.height}
          style={{
            width: photo.landscape ? `${(photo.width * 100) / photo.height}%` : "100%",
            height: photo.landscape ? "100%" : "auto"
          }}
          />
          </div>
          ))
        : undefined}
        {item && data ? (
          <div className={"item-data"}>
          <h2>{data.title||data.name}</h2>
          <p>{data.text}</p>
          </div>
          ) : (
          undefined
          )}


          <style jsx global>{`
            .item-tile {
              display: block;
              position: relative;
              width: 100%;
              height: 100%;

              border: 2px dashed white;
              overflow: hidden;
            }
            .item-image {
              position: absolute;
              top: 0;
              left: 0;

            }
            `}</style>
            </div>
            );
  })
  );

export default ItemTile;
