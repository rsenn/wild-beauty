import React, { useState } from "react";
import { Router, withRouter } from "next/router";
import { inject, observer } from "mobx-react";
import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";
import classNames from "classnames";

import DropdownTreeSelect from 'react-dropdown-tree-select'


import UploadImages from "react-upload-gallery";
import "../../static/css/react-upload-gallery.css";

export const ImageUpload = inject("rootStore")(
  observer(
    withRouter(({ rootStore, router }) => (
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
            return response.map(item => {
              const { id } = item;
              const url = `/api/image/get/${id}.jpg`;
              console.log("UploadImages response:", { item, url });
              rootStore.newImage(item);
              return url;
            })[0];
          }}
          onSuccess={arg => {
            const id = parseInt(arg.source.replace(/.*\/([0-9]+).jpg/, "$1"));
            console.log("UploadImages success:", arg);

            let entry = rootStore.newEntry(id);
            arg.remove();

            console.log("UploadImages success:", entry);
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
                    onClick={() => {
                      router.push({
                        pathname: "/new",
                        query: { step: 2, image: id, selected: index },
                        shallow: true
                      });
                      //                         rootStore.setState({ selected: index, image: id, step: 2 });
                    }}
                  />
                </SizedAspectRatioBox>
              </div>
            );
          })}
        </div>
      </div>
    ))
  )
);

export default ImageUpload;