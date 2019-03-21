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
  fetchAllRenderables,
  insertNodes,
  removeElements,
  setMultiplePositions,
} from '../actions/elements';
import { restoreHistory } from '../actions/history';
import { selectElement } from '../actions/transient';
import { addPage, duplicatePage, removePage, setPage } from '../actions/pages';
import { appReady } from '../actions/app';
import { setWorkpad } from '../actions/workpad';
import {
  getNodes,
  getNodesForPage,
  getPages,
  getSelectedElement,
  getSelectedPage,
} from '../selectors/workpad';
import {
  aeroCommitPopulateWithElements,
  aeroCommitSelectShape,
  aeroCommitUnhoverShape,
  aeroCommitUnselectShape,
  id,
  idDuplicateCheck,
  isGroupId,
  shapesForNodes,
  shapeToElement,
  updateGlobalPositionsInRedux,
} from '../../lib/aeroelastic/integration_utils';

export const aeroelastic = ({ dispatch, getState }) => {
  // When aeroelastic updates an element, we need to dispatch actions to notify redux of the changes

  const onChangeCallback = ({ state }) => {
    const nextScene = state.currentScene;
    if (!nextScene.gestureEnd) {
      return;
    } // only update redux on gesture end
    // TODO: check for gestureEnd on element selection

    // read current data out of redux
    const page = getSelectedPage(getState());
    const elements = getNodes(getState(), page);
    const selectedElement = getSelectedElement(getState());

    const shapes = nextScene.shapes;
    const persistableGroups = shapes.filter(s => s.subtype === 'persistentGroup');
    const persistedGroups = elements.filter(e => isGroupId(e.id));

    idDuplicateCheck(persistableGroups);
    idDuplicateCheck(persistedGroups);

    persistableGroups.forEach(g => {
      if (
        !persistedGroups.find(p => {
          if (!p.id) {
            throw new Error('Element has no id');
          }
          return p.id === g.id;
        })
      ) {
        const partialElement = {
          id: g.id,
          filter: undefined,
          expression: 'shape fill="rgba(255,255,255,0)" | render',
          position: {
            ...shapeToElement(g),
          },
        };
        dispatch(addElement(page, partialElement));
      }
    });

    const elementsToRemove = persistedGroups.filter(
      // list elements for removal if they're not in the persistable set, or if there's no longer an associated element
      // the latter of which shouldn't happen, so it's belts and braces
      p =>
        !persistableGroups.find(g => p.id === g.id) ||
        !elements.find(e => e.position.parent === p.id)
    );

    updateGlobalPositionsInRedux(
      positions => dispatch(setMultiplePositions(positions.map(p => ({ ...p, pageId: page })))),
      nextScene,
      elements
    );

    if (elementsToRemove.length) {
      // remove elements for groups that were ungrouped
      dispatch(removeElements(elementsToRemove.map(e => e.id), page));
    }

    // set the selected element on the global store, if one element is selected
    const selectedShape = nextScene.selectedPrimaryShapes[0];
    if (nextScene.selectedShapes.length === 1 && !isGroupId(selectedShape)) {
      if (selectedShape !== (selectedElement && selectedElement.id)) {
        dispatch(selectElement(selectedShape));
      }
    } else {
      // otherwise, clear the selected element state
      // even for groups - TODO add handling for groups, esp. persistent groups - common styling etc.
      if (selectedElement) {
        const shape = shapes.find(s => s.id === selectedShape);
        // don't reset if eg. we're in the middle of converting an ad hoc group into a persistent one
        if (!shape || shape.subtype !== 'adHocGroup') {
          dispatch(selectElement(null));
        }
      }
    }
  };

  const setStore = page => {
    aero.setStore(shapesForNodes(getNodesForPage(page)), onChangeCallback);
  };

  return next => action => {
    // get information before the state is changed
    const prevPage = getSelectedPage(getState());
    const prevElements = getNodes(getState(), prevPage);

    if (action.type === setPage.toString()) {
      setStore(getState().persistent.workpad.pages[action.payload]);
    }

    next(action);

    switch (action.type) {
      case appReady.toString():
      case restoreHistory.toString():
      case setWorkpad.toString():
        // Populate the aeroelastic store, which only happens once per page creation; disposed on workbook change.
        setStore(getPages(getState())[getState().persistent.workpad.page]);
        break;

      case addPage.toString():
      case duplicatePage.toString():
        const newPage = getState().persistent.workpad.pages[getState().persistent.workpad.page];
        setStore(newPage);
        if (action.type === duplicatePage.toString()) {
          dispatch(fetchAllRenderables()); // this shouldn't be in aeroelastic.js
        }
        break;

      case removePage.toString():
        const postRemoveState = getState();
        const freshPage =
          postRemoveState.persistent.workpad.pages[getState().persistent.workpad.page];
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
        const page = getSelectedPage(getState());
        const elements = getNodes(getState(), page);

        // TODO: add a better check for elements changing, including their position, ids, etc.
        const shouldResetState =
          prevPage !== page || !shallowEqual(prevElements.map(id), elements.map(id));
        if (shouldResetState) {
          aeroCommitPopulateWithElements(getState(), page);
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
