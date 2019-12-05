import React from "react";
import { observable } from "mobx";
export class RootStore {
  entries = observable.array([]);
}

export default RootStore;
