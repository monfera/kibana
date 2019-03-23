/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { matrix } from './aeroelastic';
import { calcNextStateFromRedux } from './aeroelastic/integration_utils';

let store;

export const aeroelastic = {
  matrix,

  setStore(shapes, selectedElement) {
    store = calcNextStateFromRedux(store, shapes, selectedElement);
  },

  getStore() {
    return store;
  },

  commit(...args) {
    return store.commit(...args);
  },
};
