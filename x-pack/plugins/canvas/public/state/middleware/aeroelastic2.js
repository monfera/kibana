/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { commitAeroelastic, updateAeroelastic } from '../actions/canvas';
import { makeUid } from '../../components/workpad_page/aeroelastic_redux_helpers';

export const aeroelastic = ({ dispatch }) => {
  // When aeroelastic updates an element, we need to dispatch actions to notify redux of the changes

  return next => action => {
    next(action);
    // todo move persistent elements of aero state into parallel redux structures and
    // move transient structures (eg. mid-drag info) into component state
    // to eliminate the need for any middleware or update here
    if (
      action.type !== updateAeroelastic.toString() &&
      action.type !== commitAeroelastic.toString()
    ) {
      // fixme make layout state update work without actions
      // (this'll automatically happen once we remove actions from aero)
      dispatch(updateAeroelastic({ type: 'keyboardEvent', payload: { uid: makeUid() } }));
    }
  };
};
