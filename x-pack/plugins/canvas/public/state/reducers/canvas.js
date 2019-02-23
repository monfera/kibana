/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { handleActions } from 'redux-actions';
import { commitAeroelastic } from '../actions/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import { reduxToAero } from '../../components/workpad_page/aeroelastic_redux_helpers';
import { matrixToAngle } from '../../lib/aeroelastic/matrix';
import { arrayToLookup } from '../../lib/aeroelastic/functional';

const shapeToElement = shape => {
  let angle = Math.round((matrixToAngle(shape.transformMatrix) * 180) / Math.PI);
  if (1 / angle === -Infinity) {
    angle = 0;
  }
  return {
    left: shape.transformMatrix[12] - shape.a,
    top: shape.transformMatrix[13] - shape.b,
    width: shape.a * 2,
    height: shape.b * 2,
    angle,
    parent: shape.parent || null,
  };
};

const isGroupId = id => id.startsWith('group');

export const canvasReducer = handleActions(
  {
    [commitAeroelastic]: (canvas, { payload }) => {
      const workpad = canvas.persistent.workpad;
      const currentScene =
        canvas.transient.aeroelastic ||
        reduxToAero({ elements: workpad.pages[workpad.page].elements });
      const selectedShapes = currentScene.selectedPrimaryShapes;
      const selected = selectedShapes[0];
      const selectedElement = selectedShapes.length === 1 && !isGroupId(selected) ? selected : null;
      const aeroelastic = nextScene({ currentScene, primaryUpdate: payload });

      const lookup =
        currentScene.gestureEnd &&
        arrayToLookup(s => s.id, currentScene.shapes.filter(s => s.type !== 'annotation'));

      const elements =
        currentScene.gestureEnd &&
        workpad.pages[workpad.page].elements.map(e => ({
          ...e,
          position: shapeToElement(lookup[e.id]),
        }));

      const persistent = currentScene.gestureEnd
        ? {
            ...canvas.persistent,
            workpad: {
              ...workpad,
              pages: workpad.pages.map((page, i) =>
                i === workpad.page
                  ? {
                      ...workpad.pages[workpad.page],
                      elements,
                    }
                  : page
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
