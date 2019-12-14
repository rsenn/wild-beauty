import React from "react";
import { inject, observer } from "mobx-react";
import Link from "next/link";

const NeedAuth = inject("rootStore")(
  observer(({ admin, userStore, rootStore, children, t, style, ...props }) =>
    rootStore.authenticated ? (
      children
    ) : rootStore.state.loading ? (
      <div className={"centered-layout padded-tb-layout"} style={style}>
        {t("Loading, please wait") + "..."}
      </div>
    ) : (
      <div className={"centered-layout padded-tb-layout"} style={style}>
        Unauthorized - Please{" "}
        <Link href="/login">
          <a className="text-pink">Login</a>
        </Link>
      </div>
    )
  )
);

export default NeedAuth;
