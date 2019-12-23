import React from "react";
import { inject, observer } from "mobx-react";
import { Translate } from "react-i18nify-mobx";

const NeedAuth = inject("rootStore")(
  observer(({ admin, userStore, rootStore, children, t, style, ...props }) => (
    <React.Fragment>
      {rootStore.authenticated === true ? (
        children
      ) : rootStore.state.loading ? (
        <div className={"auth-loading"} style={style}>
          <Translate value="common.loading" />
        </div>
      ) : (
        <div className={"auth-fail"} style={style}>
          <Translate value="login.unauthorized" />
        </div>
      )}
      <style jsx global>{`
        .auth-fail,
        .auth-loading {
          font-size: 2vmin;
        }
      `}</style>
    </React.Fragment>
  ))
);

export default NeedAuth;
