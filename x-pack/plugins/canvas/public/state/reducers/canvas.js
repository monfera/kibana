/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { handleActions } from 'redux-actions';
import {
  /*commitAeroelastic,*/
  flagAeroelastic,
  persistAeroelastic,
  /*updateAeroelastic,*/
} from '../actions/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import {
  isGroupId,
  makeUid,
  /*reduxToAero,*/
  reduxToAeroShapes,
  shapeToGroupNode,
  shapeToPosition,
} from '../../components/workpad_page/aeroelastic_redux_helpers';
import { arrayToLookup } from '../../lib/aeroelastic/functional';

export const updateAeroelastic2 = (previousAeroelastic, pageElements) => {
  const canvasAdHocGroups = previousAeroelastic.shapes
    .filter(s => s.subtype === 'adHocGroup')
    .map(shapeToGroupNode);
  const elementLookup = arrayToLookup(e => e.id, pageElements.concat(canvasAdHocGroups));
  const currentScene = {
    ...previousAeroelastic,
    shapes: reduxToAeroShapes(pageElements.concat(canvasAdHocGroups))
      .filter(s => s.subtype !== 'adHocGroup')
      .concat(
        previousAeroelastic.shapes.filter(
          s =>
            (s.type === 'annotation' && (!s.parent || elementLookup[s.parent])) || // if parent-bound, check if it remained
            s.subtype === 'adHocGroup'
        )
      ),
  };

  const aeroelastic = nextScene({
    currentScene,
    primaryUpdate: { type: 'keyboardEvent', payload: { uid: makeUid() } }, // { type: 'keyboardEvent', payload: { uid: makeUid() } }
  });
  return aeroelastic;
};

export const canvasReducer = handleActions(
  {
    /*    [updateAeroelastic]: (canvas, { payload }) => {
      const workpad = canvas.persistent.workpad;
      const pages = workpad.pages;
      const pageId = workpad.page;
      const page = pages[pageId];
      const previousAeroelastic = canvas.transient.aeroelastic || reduxToAero([]);
      const pageElements = page.elements;
      const aeroelastic = updateAeroelastic2(previousAeroelastic, pageElements);
      const selectedShapes = aeroelastic.selectedPrimaryShapes;
      const selected = selectedShapes[0];
      const selectedElement = selectedShapes.length === 1 && !isGroupId(selected) ? selected : null;

      return {
        ...canvas,
        transient: {
          ...canvas.transient,
          selectedElement,
          aeroelastic,
        },
      };
    },*/
    [flagAeroelastic]: (canvas, { payload }) => {
      return {
        ...canvas,
        transient: {
          ...canvas.transient,
          aeroelasticFlags: (canvas.transient.aeroelasticFlags || []).concat([payload]),
        },
      };
    },
    /*    [commitAeroelastic]: (canvas, { payload }) => {
      const workpad = canvas.persistent.workpad;
      const pages = workpad.pages;
      const pageId = workpad.page;
      const page = pages[pageId];
      const previousAeroelastic = canvas.transient.aeroelastic || reduxToAero([]);
      const pageElements = page.elements;
      const currentScene = previousAeroelastic;
      const aeroelastic = nextScene({ currentScene, primaryUpdate: payload });
      const selectedShapes = aeroelastic.selectedPrimaryShapes;
      const selected = selectedShapes[0];
      const selectedElement = selectedShapes.length === 1 && !isGroupId(selected) ? selected : null;
      const gestureEnd = aeroelastic.gestureEnd;

      const shapeLookup =
        gestureEnd &&
        arrayToLookup(s => s.id, aeroelastic.shapes.filter(s => s.type !== 'annotation'));

      const elements =
        gestureEnd &&
        pageElements.map(e => ({
          ...e,
          position: shapeToPosition(shapeLookup[e.id]),
        }));

      const persistent = gestureEnd
        ? {
            ...canvas.persistent,
            workpad: {
              ...workpad,
              pages: pages.map((p, i) =>
                i === pageId
                  ? {
                      ...p,
                      elements,
                    }
                  : p
              ),
            },
          }
        : canvas.persistent;

      return {
        ...canvas,
        persistent,
        transient: {
          ...canvas.transient,
          selectedElement,
          aeroelastic,
        },
      };
    },*/
    [persistAeroelastic]: (canvas, { payload: aeroelastic }) => {
      const workpad = canvas.persistent.workpad;
      const pages = workpad.pages;
      const pageId = workpad.page;
      const page = pages[pageId];
      const pageElements = page.elements;
      const selectedShapes = aeroelastic.selectedPrimaryShapes;
      const selected = selectedShapes[0];
      const selectedElement = selectedShapes.length === 1 && !isGroupId(selected) ? selected : null;
      const gestureEnd = aeroelastic.gestureEnd;

      const shapeLookup =
        gestureEnd &&
        arrayToLookup(s => s.id, aeroelastic.shapes.filter(s => s.type !== 'annotation'));

      const elements =
        gestureEnd &&
        pageElements.map(e => ({
          ...e,
          position: shapeToPosition(shapeLookup[e.id]),
        }));

      const persistent = gestureEnd
        ? {
            ...canvas.persistent,
            workpad: {
              ...workpad,
              pages: pages.map((p, i) =>
                i === pageId
                  ? {
                      ...p,
                      elements,
                    }
                  : p
              ),
            },
          }
        : canvas.persistent;

      return {
        ...canvas,
        persistent,
        transient: {
          ...canvas.transient,
          selectedElement,
          aeroelastic,
        },
      };
    },
  },
  {}
);
