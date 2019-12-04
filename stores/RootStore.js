import React from "react";
import { action, observable } from "mobx";
import { inject, observer } from "mobx-react";

export class RootStore {
  entries = observable.array([]);
}

export default RootStore;
