import React, { Component } from "react";
const LoginForm = props => (
  <div className={"login-view"}>
    <form className={"login"} method={"none"} action={""} onSubmit={e => e.preventDefault()}>
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
        font-family: "Manjari Regular";
        font-size: 1rem;
      }

      form.login {
        position: relative;
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
        border: 1px outset #808080;
        padding: 10px;
      }

      .form-button {
        font-weight: bold;
        padding: 6px 10px 2px 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        vertical-align: baseline;
        background: rgb(169, 168, 173);
        background: linear-gradient(0deg, rgba(169, 168, 173, 1) 0%, rgba(255, 255, 255, 1) 100%);
        outline: none;
        border: 1px solid rgba(169, 168, 173, 1);
      }
    `}</style>
  </div>
);
export default LoginForm;
