/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { aeroelastic as aero } from '../../lib/aeroelastic_kibana';
import { setPage } from '../actions/pages';
import { getNodesForPage, getPages } from '../selectors/workpad';
import { shapesForNodes } from '../../lib/aeroelastic/integration_utils';

export const aeroelastic = ({ getState }) => {
  const setStore = (page, selectedElement) => {
    aero.setStore(shapesForNodes(getNodesForPage(page)), selectedElement);
  };

  return next => action => {
    // get information before the state is changed
    const prevState = getState();

    if (action.type === setPage.toString()) {
      setStore(
        prevState.persistent.workpad.pages[action.payload],
        prevState.transient.selectedElement
      );
    }

    next(action);

    // get information after the state is changed
    const nextState = getState();

    setStore(
      getPages(nextState)[nextState.persistent.workpad.page],
      nextState.transient.selectedElement
    );
  };
};
