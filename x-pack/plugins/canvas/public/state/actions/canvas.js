/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createAction } from 'redux-actions';

// actions to set the application state
export const updateAeroelastic = createAction('updateAeroelastic');
export const commitAeroelastic = createAction('commitAeroelastic');
export const persistAeroelastic = createAction('persistAeroelastic');
export const flagAeroelastic = createAction('flagAeroelastic');
