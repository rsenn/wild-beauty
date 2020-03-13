import React from "react";
import RefreshIcon from "./RefreshIcon";
import UploadIcon from "./UploadIcon";

export default class List extends React.Component {
  constructor() {
    super();

    this.state = { spin: false };
  }

  render() {
    const {
        image: {
          uid,
          name,
          size,
          done,
          abort,
          click,
          error,
          remove,
          source,
          upload,
          refresh,
          progress,
          uploading
        },
        ...props
      } = this.props,
      { spin } = this.state,
      showProgress = !done && !error ? "__active" : "";

    return (
      <div {...props} key={uid} className="rug-list">
        {uploading && (
          <div
            className={`rug-list-progress ${showProgress}`}
            style={{ width: `${progress}%` }}
          />
        )}

        {uploading && (
          <span className={`rug-list-progress-count ${showProgress}`}>
            {progress || 0}%
          </span>
        )}

        {!(done || error || uploading) && (
          <div onClick={upload} className="rug-list-upload-button">
            <UploadIcon />
          </div>
        )}

        {error && typeof refresh === "function" && (
          <div
            onClick={() => {
              if (spin) return;

              this.setState({ spin: true });

              setTimeout(() => {
                this.setState({ spin: false });

                refresh();
              }, 700);
            }}
            className={`rug-list-refresh ${spin ? "__spin" : ""}`}
          >
            <div style={{ padding: 3 }}>
              <RefreshIcon />
            </div>
          </div>
        )}

        <div className="rug-list-image" onClick={click}>
          <img src={source} alt={name} />
        </div>

        <div className="rug-list-content" onClick={click}>
          <div className="rug-list-name">{name}</div>
          <div className="rug-list-size">{size}</div>
        </div>

        <div className="rug-list-remove" onClick={remove}>
          <svg viewBox="0 0 40 40">
            <path
              stroke="current"
              strokeLinecap="round"
              strokeWidth="4"
              d="M 10,10 L 30,30 M 30,10 L 10,30"
            />
          </svg>
        </div>
      </div>
    );
  }
}
