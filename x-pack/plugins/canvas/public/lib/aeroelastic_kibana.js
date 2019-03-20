/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createLayoutStore, matrix } from './aeroelastic';

let store;
let pageId;

export const aeroelastic = {
  matrix,

  setStore(initialState, onChangeCallback = () => {}, inputPageId) {
    window.store = store = createLayoutStore(initialState, onChangeCallback);
    window.pageId = pageId = inputPageId;
  },

  getStore(inputPageId) {
    return pageId === inputPageId && store;
  },

  commit(inputPageId, ...args) {
    return store && inputPageId === pageId && store.commit(...args);
  },
};
