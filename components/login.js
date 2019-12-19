import React, { Component } from "react";
import classNames from "classnames";
import { action, toJS, autorun } from "mobx";
import { autofillEvent } from "../utils/autofillEvent.js";
import { inject, observer } from "mobx-react";
import { Translate, Localize } from "react-i18nify-mobx";

const LoginForm = inject("rootStore")(
  observer(({ show = true, className, style, onLogin, rootStore, ...props }) => {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [focus, setFocus] = React.useState(false);

    const loading = rootStore.state.loading;

    if(global.window) autofillEvent(global.window);

    return (
      <React.Fragment>
        <div className={classNames("login-view", className)} style={style}>
          <div className={"form-title form-row"}>
            <Translate value="login.title" />
          </div>
          <form
            className={"login"}
            method={"none"}
            action={"/api/login"}
            onKeyPress={e => {
              if(e.keyCode == 13) {
                console.log("currentTarget: ", e.currentTarget);
                if(e.currentTarget.tagName.toLowerCase() == "button") e.target.submit();
              }
            }}
            onSubmit={e => {
              e.preventDefault();
              onLogin(username, password);
            }}
          >
            <div className={"form-field form-row"}>
              <div className={"form-label"}>
                <Translate value="login.username" />
              </div>
            </div>
            <div className={"form-field form-row"}>
              <div className={"form-value"}>
                <input
                  name={"username"}
                  type={"text"}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  size={20}
                  autoComplete={"username"}
                  onKeyDown={e => {
                    if(e.keyCode == 13) {
                      if(document && document.querySelector) {
                        e.preventDefault();
                        document.querySelector("input[name=password]").focus();
                      }
                    }
                  }}
                  ref={input => {
                    if(!focus) {
                      if(input && document.activeElement !== input) {
                        input.focus();
                        setFocus(true);
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className={"form-field form-row"}>
              <div className={"form-label"}>
                <Translate value="login.password" />
              </div>
            </div>
            <div className={"form-field form-row"}>
              <div className={"form-value"}>
                <input
                  name={"password"}
                  type={"password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  size={20}
                  autoComplete={"current-password"}
                  onKeyDown={e => {
                    if(e.keyCode == 13) {
                      if(document && document.querySelector) document.querySelector("button.form-button").focus();
                    }
                  }}
                />
              </div>
            </div>
            <div className={"form-field form-buttonfield form-row"}>
              <button className={"form-button"}>
                <Translate value="login.submit" />
              </button>
            </div>
            {loading ? (
              <div className={"form-field form-buttonfield form-row form-spinner"}>
                <div className="sk-cube-grid" style={{ opacity: loading ? 1 : 0 }}>
                  <div className="sk-cube sk-cube1"></div>
                  <div className="sk-cube sk-cube2"></div>
                  <div className="sk-cube sk-cube3"></div>
                  <div className="sk-cube sk-cube4"></div>
                  <div className="sk-cube sk-cube5"></div>
                  <div className="sk-cube sk-cube6"></div>
                  <div className="sk-cube sk-cube7"></div>
                  <div className="sk-cube sk-cube8"></div>
                  <div className="sk-cube sk-cube9"></div>
                </div>
              </div>
            ) : rootStore.authenticated || rootStore.state.error ? (
              <div className={"form-status"}>{rootStore.state.error || <Translate value="login.logged" />}</div>
            ) : (
              undefined
            )}
          </form>
          <style jsx global>{`
            .login-view {
              position: relative;

              font-family: Fixed;
              font-size: 13px;
              overflow: hidden;

              -webkit-user-select: text;
              user-select: text;
              min-height: 300px;
            }
            form.login {
              position: absolute;
              width: 100%;
              top: 30px;
              padding: 10px;
              display: flex;
              flex-flow: column nowrap;
              min-height: 50vmin;
              -webkit-user-select: text;
              user-select: text;
            }
            .form-row {
              flex: 1 1 auto;
              max-height: 50px;
            }
            .form-buttonfield {
              text-align: center;
            }
            .form-status {
              display: inline-block;
              font-size: 2em;
              font-weight: normal;
              margin: 10px auto 20px auto;
              color: rgb(123, 255, 15);
              padding: 0 4px 0 4px;
              border-radius: 2px;
              background-color: black;
            }
            .form-field {
              position: relative;
              display: flex;
              flex-direction: column;
              flex-wrap: wrap;
              justify-content: flex-start;
              align-items: stretch;
              margin: 2px 0 2px 0;
            }
            .form-label {
              flex: 0 0 auto;
              text-align: left;
            }
            .form-value {
              flex: 0 0 auto;
            }
            .form-title {
              background-color: rgba(138, 0, 16, 0.8);
              padding: 6px 16px 4px 16px;
              color: white;
              font-size: 1.5em;
              text-align: center;
            }
            .form-label {
              font-size: 1.5em;

              padding: 0 8px 0 2px;
            }
            .form-label,
            .form-value {
              vertical-align: bottom;
              margin: 0 0 0 0;
            }
            .login-view {
              position: relative;
              display: inline-block;
            }
            .form-button {
              font-family: Fixed;
              font-size: 1.5em;
              padding: 6px 10px 2px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              vertical-align: baseline;
              background: rgba(138, 0, 16, 0.5);
              background: linear-gradient(0deg, rgba(91, 0, 10, 0.75) 0%, rgba(138, 0, 16, 0.5) 100%);
              color: white;
              padding: 4px 4px 2px 4px;
              outline: none;
              border: 1px solid rgba(91, 0, 10, 1);
              box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.6);
              margin: 12px auto 8px auto;
            }
            .form-button:active {
              transform: translate(1px, 1px);
            }
            div.form-value > input {
              font-family: Fixed;
              font-size: 1.5em;

              padding: 2px 2px;
              width: 100%;
              border: 1px #c0c0c0 inset;
              border-bottom: 1px #808080 solid;
              border-right: 1px #808080 solid;

              -webkit-user-select: text;
              user-select: text;
              color: black;
            }
            .form-spinner {
              top: -4px;
            }

            .sk-cube-grid {
              width: 40px;
              height: 40px;
              margin: 10px auto 0 auto;
            }

            .sk-cube-grid .sk-cube {
              width: 33%;
              height: 33%;
              background-color: #333;
              float: left;
              -webkit-animation: sk-cubeGridScaleDelay 1.3s infinite ease-in-out;
              animation: sk-cubeGridScaleDelay 1.3s infinite ease-in-out;
            }
            .sk-cube-grid .sk-cube1 {
              -webkit-animation-delay: 0.2s;
              animation-delay: 0.2s;
            }
            .sk-cube-grid .sk-cube2 {
              -webkit-animation-delay: 0.3s;
              animation-delay: 0.3s;
            }
            .sk-cube-grid .sk-cube3 {
              -webkit-animation-delay: 0.4s;
              animation-delay: 0.4s;
            }
            .sk-cube-grid .sk-cube4 {
              -webkit-animation-delay: 0.1s;
              animation-delay: 0.1s;
            }
            .sk-cube-grid .sk-cube5 {
              -webkit-animation-delay: 0.2s;
              animation-delay: 0.2s;
            }
            .sk-cube-grid .sk-cube6 {
              -webkit-animation-delay: 0.3s;
              animation-delay: 0.3s;
            }
            .sk-cube-grid .sk-cube7 {
              -webkit-animation-delay: 0s;
              animation-delay: 0s;
            }
            .sk-cube-grid .sk-cube8 {
              -webkit-animation-delay: 0.1s;
              animation-delay: 0.1s;
            }
            .sk-cube-grid .sk-cube9 {
              -webkit-animation-delay: 0.2s;
              animation-delay: 0.2s;
            }

            @-webkit-keyframes sk-cubeGridScaleDelay {
              0%,
              70%,
              100% {
                -webkit-transform: scale3D(1, 1, 1);
                transform: scale3D(1, 1, 1);
              }
              35% {
                -webkit-transform: scale3D(0, 0, 1);
                transform: scale3D(0, 0, 1);
              }
            }

            @keyframes sk-cubeGridScaleDelay {
              0%,
              70%,
              100% {
                -webkit-transform: scale3D(1, 1, 1);
                transform: scale3D(1, 1, 1);
              }
              35% {
                -webkit-transform: scale3D(0, 0, 1);
                transform: scale3D(0, 0, 1);
              }
            }
          `}</style>
        </div>
      </React.Fragment>
    );
  })
);

export default LoginForm;
