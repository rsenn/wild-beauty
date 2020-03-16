import React, { useState, useEffect } from "react";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../simple/aspectBox.js";
import classNames from "classnames";
import axios from "../../lib/axios.js";
import Util from "../../lib/util.js";
import { RUG } from "../upload.js";

import "../../static/css/grid.css";

export const hvOffset = (width, height) => {
  let w = width > height ? (width * 100) / height : 100;
  let h = width > height ? 100 : (height * 100) / width;
  let hr, vr;
  if(h > 100) {
    hr = 0;
    vr = h - 100;
  } else if(w > 100) {
    hr = w - 100;
    vr = 0;
  }
  return { w, h, hr, vr };
};

export const ImageUpload = inject("rootStore")(
  observer(({ images, rootStore, onChoose, onDelete, onRotate, shiftState, ...props }) => {
    const [shift, setShift] = React.useState(false);

    shiftState.subscribe(newValue => {
      setShift(newValue);
      console.log("shiftState: ", newValue);
    });

    return (
      <div className={"upload-area"}>
        <RUG
          action='/api/photo/upload' // upload route
          source={async response => {
            let { affected_rows, returning, error, photo, original_name } = response;
            console.log("RUG source callback response=", response);
            if(error) returning = [photo];

            let reply = {};

            reply.photo = await (async photo => {
              const { id } = photo;
              const url = `/api/photo/get/${id}.jpg`;

              //console.log("RUG response:", { photo, url });

              let entry = toJS(rootStore.newPhoto(photo));
              reply.url = url;
              let res = await axios.head(url);
              if(res.status == 200) {
                const { width, height, aspect, channels, depth } = res.headers;
                console.log("HEAD: ", res);
                Object.assign(entry, { width, height, aspect, channels, depth });
              }
              return entry;
            })(returning[0]);

            reply = { ...reply, error };
            //console.log("RUG reply=", reply);

            return reply;
          }}
          onSuccess={arg => {
            let status = arg && arg.error ? "error" : "success";
            console.log(`RUG success callback`, { status, arg });

            if(arg && arg.source) {
              const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
              let entry = rootStore.newPhoto({ id });
              //console.log("RUG onSuccess", toJS(entry));
            }
            // arg.remove();
          }}
        >
          {(uploadedImages, options) => {
            let imageList = [...images, ...uploadedImages];

            console.log("RUG render children=", imageList);

            return (
              <div className={"upload"}>
                <div className={"upload-items __card __sorting"}>
                  {imageList.map((image, index) => {
                    let id = image.id;

                    image = toJS(image);
                    //console.log("image-list entry", {id,image});
                    const { width, height } = image;
                    const landscape = width > height;
                    const orientation = landscape ? "landscape" : "portrait";

                    let { w, h, hr, vr } = hvOffset(width, height);

                    return (
                      <div key={index} className={"upload-item"}>
                        <div className={"upload-card"}>
                          <SizedAspectRatioBox className={"item-box"} insideClassName={"tooltip"} sizeClassName={"upload-image"} insideProps={{ ["data-tooltip"]: `${width}x${height} ${orientation}` }}>
                            <img
                              id={`image-${id}`}
                              className={classNames(/*"inner-image", */ index == rootStore.state.selected && "selected")}
                              src={`/api/photo/get/${id}.jpg`}
                              width={width}
                              height={height}
                              orientation={orientation}
                              style={{
                                position: "relative",
                                marginTop: `${-vr / 2}%`,
                                marginLeft: `${-hr / 2}%`,
                                width: landscape ? `${(width * 100) / height}%` : "100%",
                                height: landscape ? "100%" : "auto"
                              }}
                              onClick={onChoose}
                            />
                          </SizedAspectRatioBox>
                          <button className={"image-button image-delete center-flex"} onClick={() => onDelete(id)}>
                            <svg height='24' width='24' viewBox='0 0 16 16'>
                              <defs />
                              <path fill={"#f00"} stroke={"#a00"} d='M11.004 3.982a1 1 0 00-.707.293L8.004 6.568 5.72 4.285a1 1 0 00-.01-.01 1 1 0 00-.701-.289L5 4a1 1 0 00-1 1 1 1 0 00.293.707L6.586 8l-2.293 2.293a1 1 0 00-.29.7 1 1 0 001 1 1 1 0 00.708-.294l2.293-2.293 2.283 2.283a1 1 0 00.717.303 1 1 0 001-1 1 1 0 00-.293-.707l-2.3-2.299 2.282-2.283a1 1 0 00.31-.72 1 1 0 00-1-1z' />
                            </svg>
                          </button>
                          <button className={"image-button image-rotate center-flex"} onClick={() => onRotate(id, shift ? -90 : 90)}>
                            <svg height='24' width='24' viewBox='0 0 16 16'>
                              <defs />
                              <path
                                d='M-0.073 -6.647 C-2.720 -6.653 -5.130 -4.763 -6.030 -2.317 C-7.210 0.453 -6.122 3.955 -3.564 5.552 C-1.074 7.194 2.546 6.833 4.587 4.627 A7.398 7.398 0 0 0 5.682 3.159 L3.516 1.819 C2.580 3.856 -0.228 4.711 -2.122 3.461 C-3.893 2.389 -4.511 -0.136 -3.436 -1.909 C-2.640 -3.535 -0.676 -4.516 1.086 -3.969 C1.586 -3.830 2.061 -3.592 2.464 -3.263 L0.930 -2.203 L6.880 0.617 L6.347 -5.947 L4.595 -4.737 C3.399 -5.994 1.656 -6.687 -0.074 -6.647 Z'
                                fill={"hsl(210,100%,70%)"}
                                stroke='#00f'
                                strokeWidth='.347'
                                transform={`translate(7.5, 7.8) scale(0.8, 0.8)`}
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        </RUG>
        <style jsx global>{`
          .upload-item {
            cursor: -webkit-grab;
            cursor: grab;
          }
          .upload-area {
            position: relative;
          }
          div.upload-area > div > div,
          div.upload-area > div > div > div {
            position: relative;
            display: block;
          }
          .item-box {
            box-sizing: content-box;
            overflow: hidden;
          }
          .item-box-size {
            border: 1px solid black;
            box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.75);
            width: 100%;
            height: 100%;
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
          .image-button:active > svg {
            transform: translate(1px, 1px);
          }
          .image-button:active {
            border: 1px inset #cdcdcd;
          }
          .image-button:hover {
            background: #ffdc20c0;
            filter: drop-shadow(0px 0px 10px #ffdc20c0);
          }
          .auth-fail {
            position: relative;
          }

          .upload-dragging-item > div:not(.upload-list) {
            transform: scale(1.1);
          }

          .upload {
            font-size: 14px;
            color: #000;
            min-width: 80vw;
          }

          .upload .upload-file-input {
            display: none !important;
          }

          .upload .upload-item {
            justify-content: center;
            user-select: none;
            cursor: default;
          }

          .upload .upload-items.__card {
            display: flex;
            flex-flow: row wrap;
          }

          .upload .upload-items.__card .upload-item {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .upload .upload-items.__list {
            padding-top: 30px;
            min-height: 220px;
          }

          .upload .upload-handle {
            height: 290px;
            overflow: hidden;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
          }

          .upload .upload-handle:before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: calc(100% - 8px);
            height: calc(100% - 8px);
            border: 4px solid #000;
          }

          .upload .upload-handle .upload-handle-info,
          .upload-card {
            position: relative;
          }

          .upload .upload-handle svg.upload-handle-icon {
            width: 70px;
          }

          .upload .upload-handle svg.upload-handle-icon line,
          .upload .upload-handle svg.upload-handle-icon polyline {
            fill: none;
            stroke: #000;
            stroke-linejoin: round;
            stroke-width: 2px;
            stroke-linecap: round;
          }

          .upload .upload-handle.__dragging:before {
            border: 4px dashed rgba(138, 0, 16, 0.8);
            background-color: rgba(0, 122, 255, 0.15);
          }

          .upload .upload-handle.__dragging svg line,
          .upload .upload-handle.__dragging svg polyline {
            stroke: rgba(138, 0, 16, 0.8);
          }

          .upload .upload-handle.__dragging .__arrow {
            animation: 1s up-arrow forwards infinite;
          }

          .upload .upload-handle .upload-handle-info .upload-handle-drop-text {
            font-size: 22px;
          }

          .upload .upload-handle .upload-handle-info .upload-handle-button {
            background-color: rgba(138, 0, 16, 0.8);
            padding: 7px 12px;
            font-size: 16px;
            color: #fff;
            text-align: center;
            max-width: 250px;
            display: block;
            margin: 0 auto;
          }

          .upload .upload-handle .upload-handle-info .upload-handle-button:hover {
            background-color: rgba(192, 8, 32, 0.8);
          }

          .upload .upload-handle .upload-handle-info span {
            text-align: center;
            padding: 10px 0;
            font-size: 17px;
            display: block;
          }
          .upload-item {
            position: relative;
          }

          .upload-card {
            flex: 1 1 20%;
            font-family: Fixed;
            overflow: auto;
          }
          @media (max-width: 376px) {
            .upload-item {
              width: 33%;
            }
            .upload-card {
              margin: 5px;
            }
            .upload .upload-items.__card {
              margin: 0 -5px;
            }
          }
          @media (min-width: 376px) {
            .upload-item {
              width: 20%;
            }
            .upload-card {
              margin: 10px;
            }
            .upload .upload-items.__card {
              margin: 0 -10px;
            }
          }

          .upload-card.__error {
            border: 3px solid rgba(160, 0, 16, 1);
          }

          .upload-card .upload-card-image {
            width: 100%;
            padding-top: 100%;
            background-position: 50%;
            background-size: contain;
            background-repeat: no-repeat;
          }

          .upload-card .upload-card-name {
            position: absolute;
            z-index: 15;
            height: 100px;
            width: 100%;
            font-weight: 700;
            font-size: 12px;
            white-space: nowrap;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0, rgba(0, 0, 0, 0.7) 29%, transparent);
            background-blend-mode: multiply;
            color: #f5f5f5;
          }

          .upload-card .upload-card-progress,
          .upload-card .upload-card-progress-count,
          .upload-card .upload-card-refresh,
          .upload-card .upload-card-upload-button {
            top: calc(50% - 25px);
            left: calc(50% - 25px);
            width: 50px;
            height: 50px;
            position: absolute;
          }

          .upload-card .upload-card-name > div {
            margin: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .upload-card .upload-card-size {
            color: #c3c3c3;
            font-size: 11px;
          }

          .upload-card .upload-card-progress {
            display: block;
          }

          .upload-card .upload-card-progress .__progress-cricle {
            stroke: rgba(138, 0, 16, 0.8);
            fill: none;
            stroke-width: 5;
            stroke-linecap: round;
            transition: stroke-dasharray 0.2s ease;
          }

          .upload-card .upload-card-progress-count {
            text-align: center;
            line-height: 50px;
            color: #fff;
            font-weight: 700;
          }

          .upload-card .upload-card-refresh {
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            border: 2px solid transparent;
          }

          .upload-card .upload-card-refresh:hover {
            background-color: rgba(255, 255, 255, 0.9);
            border: 2px solid #000;
          }

          .upload-card .upload-card-refresh .__refresh-icon g {
            fill: #3d4852;
          }

          .upload-card .upload-card-refresh.__spin {
            animation: __spin 1s linear infinite;
            border: 2px solid rgba(138, 0, 16, 0.8) !important;
          }

          .upload-card .upload-card-refresh.__spin .__refresh-icon g {
            fill: rgba(138, 0, 16, 0.8);
          }

          .upload-card .upload-card-upload-button {
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 20;
            text-align: center;
            border: 2px solid transparent;
          }

          .upload-card .upload-card-upload-button svg {
            width: 25px;
            margin-top: 6px;
          }

          .upload-card .upload-card-upload-button svg line,
          .upload-card .upload-card-upload-button svg polyline {
            fill: none;
            stroke: #000;
            stroke-linejoin: round;
            stroke-width: 3px;
            stroke-linecap: round;
          }

          .upload-card .upload-card-upload-button:hover {
            border: 2px solid rgba(138, 0, 16, 0.8);
            background-color: rgba(255, 255, 255, 0.9);
          }

          .upload-card .upload-card-upload-button:hover svg line,
          .upload-card .upload-card-upload-button:hover svg polyline {
            stroke: rgba(138, 0, 16, 0.8);
          }

          .upload-card .upload-card-upload-button:hover svg .__arrow {
            animation: 1s up-arrow forwards infinite;
          }

          .upload-card .upload-card-remove {
            position: absolute;
            z-index: 40;
            bottom: 0;
            right: 0;
            color: #fff;
            background-color: #000;
            opacity: 0.75;
            border-radius: 9999px;
            margin: 4px;
            padding: 4px;
            width: 22px;
            height: 22px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1.5px solid transparent;
            transition: border 0.2s ease;
          }

          .upload-card .upload-card-remove:hover {
            border: 1.5px solid #fff;
          }

          .upload-card .upload-card-remove svg {
            stroke: currentColor;
            height: 18px;
            width: 18px;
          }

          .upload-list {
            width: 100%;
            background-color: #000;
            border-radius: 3px;
            position: relative;
            font-family: Helvetica;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            margin-bottom: 10px;
          }

          .upload-list.__error {
            border: 3px solid rgba(160, 0, 16, 1);
          }

          .upload-list .upload-list-progress {
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 5px;
            background: rgba(138, 0, 16, 0.8);
            border: 3px;
            opacity: 0;
            transition: all 0.2s ease;
          }

          .upload-list .upload-list-refresh,
          .upload-list .upload-list-upload-button {
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 25px;
            height: 25px;
            z-index: 20;
          }

          .upload-list .upload-list-progress.__active {
            opacity: 1;
          }

          .upload-list .upload-list-progress-count {
            position: absolute;
            bottom: 5px;
            right: 5px;
            color: #f5f5f5;
            font-size: 13px;
            opacity: 0;
            transition: all 0.2s ease;
          }

          .upload-list .upload-list-progress-count.__active {
            opacity: 1;
          }

          .upload-list .upload-list-refresh {
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.7);
            border: 2px solid transparent;
          }

          .upload-list .upload-list-refresh:hover {
            background-color: rgba(255, 255, 255, 0.9);
          }

          .upload-list .upload-list-refresh .__refresh-icon g {
            fill: #3d4852;
          }

          .upload-list .upload-list-refresh.__spin {
            animation: __spin 1s linear infinite;
          }

          .upload-list .upload-list-refresh.__spin .__refresh-icon g {
            fill: rgba(138, 0, 16, 0.8);
          }

          .upload-list .upload-list-upload-button {
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.7);
            text-align: center;
            border: 2px solid transparent;
          }

          .upload-list .upload-list-upload-button svg {
            width: 15px;
            margin-top: 2px;
          }

          .upload-list .upload-list-upload-button svg line,
          .upload-list .upload-list-upload-button svg polyline {
            fill: none;
            stroke: #000;
            stroke-linejoin: round;
            stroke-width: 3px;
            stroke-linecap: round;
          }

          .upload-list .upload-list-upload-button:hover {
            background-color: rgba(255, 255, 255, 0.9);
          }

          .upload-list .upload-list-upload-button:hover svg line,
          .upload-list .upload-list-upload-button:hover svg polyline {
            stroke: rgba(138, 0, 16, 0.8);
          }

          .upload-list .upload-list-upload-button:hover svg .__arrow {
            animation: 1s up-arrow forwards infinite;
          }

          .upload-list .upload-list-image {
            width: 100px;
            height: 70px;
            padding: 5px;
          }

          .upload-list .upload-list-image img {
            width: 100%;
            height: 100%;
          }

          .upload-list .upload-list-content {
            padding: 5px;
            width: calc(100% - 120px);
          }

          .upload-list .upload-list-content .upload-list-name {
            color: #f5f5f5;
            white-space: nowrap;
            font-size: 14px;
            text-overflow: ellipsis;
            position: relative;
            overflow: hidden;
            width: calc(100% - 40px);
          }

          .upload-list .upload-list-content .upload-list-size {
            color: #ddd;
            font-size: 12px;
            margin-top: 3px;
          }

          .upload-list .upload-list-remove {
            position: absolute;
            z-index: 40;
            top: 0;
            right: 0;
            color: #ccc;
            opacity: 0.75;
            border-radius: 9999px;
            padding: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .upload-list .upload-list-remove svg {
            stroke: currentColor;
            height: 22px;
            width: 22px;
          }

          .upload-list .upload-list-remove:hover {
            color: #fff;
          }
        `}</style>
      </div>
    );
  })
);

export default ImageUpload;
