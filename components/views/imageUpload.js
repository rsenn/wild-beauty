import React from "react";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { SizedAspectRatioBox } from "../simple/aspectBox.js";
import classNames from "classnames";
import axios from "../../lib/axios.js";
import Util from "../../lib/util.js";
import UploadImages from "react-upload-gallery";

import "../../static/css/grid.css";

export const ImageUpload = inject("rootStore")(
  observer(({ images, rootStore, onChoose, onDelete, onRotate }) => (
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
      <div className={"image-list grid-col grid-gap-5"}>
        {images.map((image, index) => {
          let id = image.id;

          image = toJS(image);
          //console.log("image-list entry", {id,image});
          const { width, height } = image;
          const landscape = width > height;
          const orientation = landscape ? "landscape" : "portrait";

          return (
            <div key={index} className={"image-entry tooltip"} data-tooltip={`${width}x${height} ${orientation}`}>
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
              <button
                className={"image-button image-delete center-flex"}
                onClick={() => {
                  console.log("delete clicked");
                  onDelete(id);
                }}
              >
                <img src={"/static/img/icon-cancel.svg"} />
              </button>
              <button
                className={"image-button image-rotate center-flex"}
                onClick={() => {
                  console.log("rotate clicked");
                  onRotate(id);
                }}
              >
                <img src={"/static/img/icon-rotate.svg"} />
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
  ))
);

export default ImageUpload;
