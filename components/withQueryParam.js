import React from "react";
import { withRouter, useRouter } from "next/router";
import Util from "../utils/util.js";

export const WithQueryParam = withRouter(({ children, router, ...props }) => Object.keys(props).every(propName => (props[propName] === true ? router.query[propName] !== undefined : props[propName] ? router.query[propName] == props[propName] : !router.query[propName])) && children);

export function IfQueryParam({ children, ...props }) {
  const router = useRouter();
  const { asPath, pathname, url } = router;
  let query = asPath != pathname ? Util.parseURL("any://0.0.0.0" + asPath).query : router.query;
  console.log("IfQueryParam", { query, asPath, pathname, url });
  return Object.keys(props).every(propName => (props[propName] === true ? query[propName] !== undefined : props[propName] ? query[propName] == props[propName] : !query[propName])) && children;
}

export default WithQueryParam;
