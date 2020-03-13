import React, { useState, useEffect } from "react";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../simple/aspectBox.js";
import classNames from "classnames";
import axios from "../../lib/axios.js";
import Util from "../../lib/util.js";
import UploadImages from "react-upload-gallery";

import "../../static/css/grid.css";

export const ImageUpload = inject("rootStore")(
  observer(({ images, rootStore, onChoose, onDelete, onRotate, shiftState, ...props }) => {
    const [shift, setShift] = React.useState(false);
    shiftState.subscribe(newValue => {
      setShift(newValue);
      console.log("shiftState: ", newValue);
    });

    return (
      <div className={"upload-area"}>
        <UploadImages
          action="/api/image/upload" // upload route
          source={response => {
            return response.map(photo => {
              console.log("UploadImages response:", { photo, url });
              const { id } = photo;
              const url = `/api/image/get/${id}.jpg`;
              let entry = rootStore.newImage(photo);
              axios.head(url).then(res => {
                if(res.status == 200) {
                  const { width, height, aspect, channels, depth } = res.headers;
                  console.log("HEAD: ", res);
                  Object.assign(entry, { width, height, aspect, channels, depth, ...entry });
                }
              });
              return url;
            })[0];
          }}
          onSuccess={arg => {
            const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
            console.log("UploadImages success:", { id, arg });
            let entry = rootStore.newImage({ id });
            console.log("UploadImages success:", toJS(entry));
            arg.remove();
          }}
        ></UploadImages>
        <div className={"image-list grid-col grid-gap-10"}>
          {images.map((image, index) => {
            let id = image.id;

            image = toJS(image);
            //console.log("image-list entry", {id,image});
            const { width, height } = image;
            const landscape = width > height;
            const orientation = landscape ? "landscape" : "portrait";

            return (
              <div key={index} className={"image-entry tooltip "} data-tooltip={`${width}x${height} ${orientation}`}>
                <SizedAspectRatioBox className={"item-box"}>
                  <img
                    id={`image-${id}`}
                    className={classNames(/*"inner-image", */ index == rootStore.state.selected && "selected")}
                    src={`/api/image/get/${id}.jpg`}
                    width={width}
                    height={height}
                    orientation={orientation}
                    style={{
                      width: landscape ? `${(width * 100) / height}%` : "100%",
                      height: landscape ? "100%" : "auto"
                    }}
                    onClick={onChoose}
                  />
                </SizedAspectRatioBox>
                <button className={"image-button image-delete center-flex"} onClick={() => onDelete(id)}>
                  <svg height="24" width="24" viewBox="0 0 16 16">
                    <defs />
                    <path fill={"#f00"} stroke={"#a00"} d="M11.004 3.982a1 1 0 00-.707.293L8.004 6.568 5.72 4.285a1 1 0 00-.01-.01 1 1 0 00-.701-.289L5 4a1 1 0 00-1 1 1 1 0 00.293.707L6.586 8l-2.293 2.293a1 1 0 00-.29.7 1 1 0 001 1 1 1 0 00.708-.294l2.293-2.293 2.283 2.283a1 1 0 00.717.303 1 1 0 001-1 1 1 0 00-.293-.707l-2.3-2.299 2.282-2.283a1 1 0 00.31-.72 1 1 0 00-1-1z" />
                  </svg>
                </button>
                <button className={"image-button image-rotate center-flex"} onClick={() => onRotate(id, shift ? -90 : 90)}>
                  <svg height="24" width="24" viewBox="0 0 16 16">
                    <defs />
                    <g transform={`translate(7.483179807662964, 0)`}>
                      <g transform={` scale(${shift ? -1 : 1}, 1)`}>
                        <g>
                          <path d=" m 4.509820430755616 10.754 a 5.059 5.059 0 0 1 -3.176 2.27 a 5.056 5.056 0 0 1 -3.84 -0.708 a 5.051 5.051 0 0 1 -2.105 -3.006 a 5.051 5.051 0 0 1 0.517 -3.634 h 0 a 4.969 4.969 0 0 1 2.939 -2.586 a 4.97 4.97 0 0 1 3.895 0.39 a 4.94 4.94 0 0 1 2.005 2.11" fill="none" stroke="#00f" strokeWidth="1.66983039" />
                          <path d="m 1.9508197154998772 5.852 l 4.516 2.14 l -0.405 -4.981 l -4.11 2.84 Z " fill="#00f" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        <style jsx global>{`
          .upload-area {
            position: relative;
            padding: 0px 10px;
            min-width: 80vmin;
          }
          div.upload-area > div > div,
          div.upload-area > div > div > div {
            position: relative;
            display: block;
            width: 100%;
            height: 100%;
          }
          .item-box-size {
            border: 1px solid black;
            box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.75);
            box-sizing: border-box;
          }
          .aspect-ratio-box {
            overflow: hidden;
          }
          .image-entry {
            position: relative;
          }
          .image-buttonlist {
          }
          .image-button {
            position: absolute;
            padding: 0;
            border: 1px outset #cdcdcd;
            border-radius: 99999px;
            background: #ffffff60;
            filter: drop-shadow(1px 1px 10px #ffffffff);
          }
          .image-button > img {
            position: relative;
            width: 24px;
            height: 24px;
          }
          .image-delete {
            top: 2px;
            right: 2px;
          }
          .image-rotate {
            top: 30px;
            right: 2px;
          }
          .image-delete:active > img {
            transform: translate(1px, 1px);
          }
          .image-delete:active {
            border: 1px inset #cdcdcd;
          }
          .image-delete:hover {
            background: #ffdc20c0;
          }
          .auth-fail {
            position: relative;
          }
          .image-list {
            width: 100%;
            margin: 20px -20px 0 0;
          }
          .image-list {
            display: grid;
            margin: 10px 0 0 0;
          }
          .image-list > div {
            flex: 1 1 auto;
          }
          .image-entry {
            margin: 0 10px 0 0;
            flex: 1 1 auto;
          }
        `}</style>
      </div>
    );
  })
);

export default ImageUpload;
