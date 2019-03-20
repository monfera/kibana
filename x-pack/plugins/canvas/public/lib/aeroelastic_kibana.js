/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createLayoutStore, matrix } from './aeroelastic';

const stores = new Map();

window.stores = stores

export const aeroelastic = {
  matrix,

  clearStores() {
    stores.clear();
  },

  createStore(initialState, onChangeCallback = () => {}, page) {
    if(typeof page !== 'string') debugger
    stores.set(page, createLayoutStore(initialState, onChangeCallback));
  },

  removeStore(page) {
    if (stores.has(page)) {
      stores.delete(page);
    }
  },

  getStore(page) {
    const store = stores.get(page);

    return store && store.getCurrentState();
  },

  commit(page, ...args) {
    const store = stores.get(page);
    return store && store.commit(...args);
  },
};
