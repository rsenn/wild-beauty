import React, { Component } from "react";
import classNames from "classnames";

const LoginForm = ({ show = true, className, style, ...props }) => (
  <React.Fragment>
    <span>Login</span>
    <div className={classNames("login-view", className)} style={style}>
      <form
        className={"login"}
        style={{ display: show ? "block" : "none" }}
        method={"none"}
        action={""}
        onSubmit={e => e.preventDefault()}
      >
        <div className={"form-field"}>
          <label className={"form-label"}>Benutzername:</label>
          <div className={"form-value"}>
            <input type={"text"} value={""} size={30} />
          </div>
        </div>
        <div className={"form-field"}>
          {" "}
          <label className={"form-label"}>Passwort:</label>
          <div className={"form-value"}>
            <input type={"password"} value={""} size={30} />
          </div>
        </div>
        <div className={"form-field"}>
          <button className={"form-button"}>Login</button>
        </div>
      </form>
      <style jsx global>{`
        .login-view {
          font-family: Fixed;
        }

        form.login {
          position: relative;
          padding: 10px;
        }

        .form-field {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          align-items: baseline;
          margin: 2px 0 2px 0;
        }

        .form-label {
          text-align: right;
          padding: 0 2px 0 2px;
        }

        .form-label,
        .form-value {
          vertical-align: bottom;
          margin: auto 0 auto 0;
          height: 100%;
          line-height: 100%;
          flex: 1;
        }

        .login-view {
          position: relative;
          display: inline-block;
        }

        .form-button {
          font-weight: bold;
          padding: 6px 10px 2px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          vertical-align: baseline;
          background: rgba(138, 0, 16, 0.5);
          background: linear-gradient(0deg, rgba(91, 0, 10, 0.75) 0%, rgba(138, 0, 16, 0.5) 100%);
          color: white;
          padding: 4px 4px 6px 4px;
          outline: none;
          border: 1px solid rgba(91, 0, 10, 1);
        }
      `}</style>
    </div>
  </React.Fragment>
);
export default LoginForm;
