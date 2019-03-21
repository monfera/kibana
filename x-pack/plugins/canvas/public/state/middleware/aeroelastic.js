/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { shallowEqual } from 'recompose';
import { aeroelastic as aero } from '../../lib/aeroelastic_kibana';
import {
  addElement,
  elementLayer,
  insertNodes,
  removeElements,
  setMultiplePositions,
} from '../actions/elements';
import { restoreHistory } from '../actions/history';
import { selectElement } from '../actions/transient';
import { addPage, duplicatePage, removePage, setPage } from '../actions/pages';
import { appReady } from '../actions/app';
import { setWorkpad } from '../actions/workpad';
import { getNodes, getNodesForPage, getPages, getSelectedPage } from '../selectors/workpad';
import {
  aeroCommitPopulateWithElements,
  aeroCommitSelectShape,
  aeroCommitUnhoverShape,
  aeroCommitUnselectShape,
  id,
  makeChangeCallback,
  shapesForNodes,
} from '../../lib/aeroelastic/integration_utils';

export const aeroelastic = ({ dispatch, getState }) => {
  // When aeroelastic updates an element, we need to dispatch actions to notify redux of the changes

  const onChangeCallback = makeChangeCallback(dispatch, getState);

  const setStore = page => {
    aero.setStore(shapesForNodes(getNodesForPage(page)), onChangeCallback);
  };

  return next => action => {
    // get information before the state is changed
    const prevState = getState();
    const prevPage = getSelectedPage(prevState);
    const prevElements = getNodes(prevState, prevPage);

    if (action.type === setPage.toString()) {
      setStore(prevState.persistent.workpad.pages[action.payload]);
    }

    next(action);

    const nextState = getState();

    switch (action.type) {
      case appReady.toString():
      case restoreHistory.toString():
      case setWorkpad.toString():
        setStore(getPages(nextState)[nextState.persistent.workpad.page]);
        break;

      case addPage.toString():
      case duplicatePage.toString():
        const newPage = nextState.persistent.workpad.pages[nextState.persistent.workpad.page];
        setStore(newPage);
        break;

      case removePage.toString():
        const postRemoveState = nextState;
        const freshPage =
          postRemoveState.persistent.workpad.pages[nextState.persistent.workpad.page];
        setStore(freshPage);
        break;

      case selectElement.toString():
        // without this condition, a mouse release anywhere will trigger it, leading to selection of whatever is
        // underneath the pointer (maybe nothing) when the mouse is released
        if (action.payload) {
          aeroCommitSelectShape(action.payload);
        } else {
          aeroCommitUnselectShape();
        }

        break;

      case removeElements.toString():
      case addElement.toString():
      case insertNodes.toString():
      case elementLayer.toString():
      case setMultiplePositions.toString():
        const page = getSelectedPage(nextState);
        const elements = getNodes(nextState, page);

        // TODO: add a better check for elements changing, including their position, ids, etc.
        const shouldResetState =
          prevPage !== page || !shallowEqual(prevElements.map(id), elements.map(id));
        if (shouldResetState) {
          aeroCommitPopulateWithElements(nextState, page);
        }

        if (
          action.type !== setMultiplePositions.toString() &&
          action.type !== elementLayer.toString()
        ) {
          aeroCommitUnselectShape();
        }

        break;
    }
  };
};
