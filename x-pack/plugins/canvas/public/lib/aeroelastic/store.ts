/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ActionId, Payload, State, TypeName, UpdaterFunction } from '.';

let counter = 0 as ActionId;

export const createStore = (initialState: State, updater: UpdaterFunction) => {
  let currentState = initialState;

  const getCurrentState = () => currentState;

  const commit = (type: TypeName, payload: Payload) => {
    return (currentState = updater({
      ...currentState,
      primaryUpdate: {
        type,
        payload: { ...payload, uid: counter++ },
      },
    }));
  };

  return { getCurrentState, commit };
};
