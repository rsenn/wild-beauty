import React, { useState } from "react";
import { inject, observer } from "mobx-react";
import { toJS } from "mobx";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";

const ArrowNext = ({ innerFill = "#ffffff", ...props }) => (
  <svg height="48" id="svg8" width="48" {...props} preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 47.487945 47.487945" xmlns="http://www.w3.org/2000/svg">
    <defs />
    <path
      id="path5290-5-6-6-3"
      style={{ opacity: "1", fill: innerFill, fillOpacity: "1", stroke: "none", strokeWidth: "2.061728", strokeMiterlimit: "4", paintOrder: "markers stroke fill" }}
      d="M 31.052734 13.316406 L 31.052734 25.316406 L 12.400391 25.316406 L 12.400391 40.316406 L 31.052734 40.318359 L 31.052734 50.316406 L 51.828125 32.316406 L 31.052734 13.316406 z "
      transform="scale(0.74999999)"
    />
    <path
      style={{ opacity: "1", fill: "#000000", fillOpacity: "1", stroke: "none", strokeWidth: "2.061728", strokeMiterlimit: "4", paintOrder: "markers stroke fill" }}
      d="M 0.0546875,0.0546875 V 63.263672 H 63.263672 V 0.0546875 Z m 30.9980465,13.2625735 20.775391,19 -20.775391,18 V 40.318212 L 12.4,40.31631 V 25.317261 h 18.652734 z"
      transform="scale(0.74999999)"
    />
  </svg>
);

export const ItemView = inject("rootStore")(
  observer(({ rootStore, id, onPrev, onNext }) => {
    let item = rootStore.getItem(id);
    console.log("Item ID: ", id);
    console.log("Item: ", toJS(item));

    if(item) {
      if(!item.photos || !item.photos.length)
        item.photos = [
          {
            href: "/static/img/no-image.svg",
            width: 512,
            height: 512,
            id: -1
          }
        ];
    }

    return (
      <React.Fragment>
        <div className={"item-view"}>
          {item && item.photos && item.photos.map
            ? item.photos.map(photo => (
                <SizedAspectRatioBox className={"item-box"}>
                  <img
                    src={photo.href || `/api/image/get/${photo.id}`}
                    width={photo.width}
                    height={photo.height}
                    style={{
                      width: photo.landscape ? `${(photo.width * 100) / photo.height}%` : "100%",
                      height: photo.landscape ? "100%" : "auto"
                    }}
                  />
                </SizedAspectRatioBox>
              ))
            : undefined}
          {item && item.data ? (
            <div className={"item-data"}>
              <h2>{item.data.title}</h2>
              <p>{item.data.text}</p>
            </div>
          ) : (
            undefined
          )}
        </div>
        <a
          className={"button-prev"}
          href={"#"}
          onClick={e => {
            e.preventDefault();
            if(typeof onPrev == "function") onPrev(e);
          }}
        >
          <ArrowNext innerFill={"hsla(300,80%,40%,1)"} style={{ transform: "scaleX(-1)" }} />
        </a>
        <a
          className={"button-next"}
          href={"#"}
          onClick={e => {
            e.preventDefault();
            if(typeof onNext == "function") onNext(e);
          }}
        >
          <ArrowNext innerFill={"hsla(250,100%,60%,1)"} />
        </a>

        <style jsx global>{`
          .item-view {
            position: relative;
            padding: 0 auto 48px auto;
            max-width: 80vmin;
            display: flex;
            flex-flow: column nowrap;
            justify-content: flex-start;
            align-items: flex-start;
            margin: 0 5vmin 58px 5vmin;
          }
          .item-data > h2 {
            margin: 0.33em 0 8px 0;
          }
          .item-data > p {
            font-size: 16px;
          }
          .item-data {
            width: 100%;
            text-align: left;
            flex: 1 1 auto;
          }
          .item-box-size {
            flex: 1 1 auto;
            min-width: 79.9vmin;
            min-height: 79.9vmin;
            max-width: 80vmin;
            max-height: 80vmin;
            box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.6);
          }
          .item-box {
            overflow: hidden;
          }
          .button-next {
            position: absolute;
            bottom: 0;
            right: 0;
            margin: 0 10px 10px 0;
          }
          .button-prev {
            position: absolute;
            bottom: 0;
            left: 0;
            margin: 0 0 10px 10px;
          }
          .aspect-ratio-box, .item-box-outside {
            overflow: hidden;
          }
        `}</style>
      </React.Fragment>
    );
  })
);

export default ItemView;
