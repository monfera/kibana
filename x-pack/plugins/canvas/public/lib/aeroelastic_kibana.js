/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createLayoutStore, matrix } from './aeroelastic';

let store;

export const aeroelastic = {
  matrix,

  setStore(initialState, onChangeCallback = () => {}, pageId) {
    console.log('setting store', pageId);
    if (typeof pageId !== 'string') debugger;
    window.store = store = createLayoutStore(initialState, onChangeCallback);
  },

  getStore() {
    return store;
  },

  commit(page, ...args) {
    return store && store.commit(...args);
  },
};
