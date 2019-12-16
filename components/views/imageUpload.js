import React, { useState } from "react";
import { Router, withRouter } from "next/router";
import { inject, observer } from "mobx-react";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";
import classNames from "classnames";

import DropdownTreeSelect from "react-dropdown-tree-select";

import UploadImages from "react-upload-gallery";
import "../../static/css/react-upload-gallery.css";

export const ImageUpload = inject("rootStore")(
  observer(
    /*withRouter*/ ({ rootStore, onChoose }) => (
      <div
        className={"upload-area"}
        style={{
          minWidth: "80vmin"
          // minHeight: "80vmin"
        }}
      >
        <UploadImages
          action="/api/image/upload" // upload route
          source={response => {
            return response.map(photo => {
              console.log("UploadImages response:", { photo, url });
              const { id } = photo;
              const url = `/api/image/get/${id}.jpg`;
              rootStore.newImage(photo);
              return url;
            })[0];
          }}
          onSuccess={arg => {
            const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
              console.log("UploadImages success:", { id ,arg });

            let entry = rootStore.newImage(id);

            console.log("UploadImages success:", toJS(entry));
       //     arg.remove();
          }}
        ></UploadImages>
        <div className={"image-list"}>
          {[...rootStore.images.entries()].map(([id, image], index) => {
            const { width, height } = image;
            const landscape = width > height;

            return (
              <div className={"item-entry"}>
                <SizedAspectRatioBox className={"item-box"}>
                  <img
                    id={`image-${id}`}
                    className={classNames(/*"inner-image", */ index == rootStore.state.selected && "selected")}
                    src={`/api/image/get/${id}.jpg`}
                    width={width}
                    height={height}
                    orientation={landscape ? "landscape" : "portrait"}
                    style={{
                      width: landscape ? `${(width * 100) / height}%` : "100%",
                      height: landscape ? "100%" : "auto"
                    }}
                    onClick={onChoose}
                  />
                </SizedAspectRatioBox>
              </div>
            );
          })}
        </div>
        <style jsx global>{`
          div.upload-area > div,
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
          .image-list {
            display: inline-flex;
            flex-flow: row wrap;
            flex-basis: 30%;
            justify-content: center;
            max-width: 80vw;
            margin: 20px 0;
          }
          .image-list > div {
            flex: 0 1 auto;
            width: 30vw;
          }
        `}</style>
      </div>
    )
  )
);

export default ImageUpload;
