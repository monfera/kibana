/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { handleActions } from 'redux-actions';
import { commitAeroelastic } from '../actions/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import { reduxToAero } from '../../components/workpad_page/aeroelastic_redux_helpers';
import { getSelectedElement } from '../selectors/workpad';

const isGroupId = id => id.startsWith('group');

export const canvasReducer = handleActions(
  {
    [commitAeroelastic]: (canvas, { payload }) => {
      const workpad = canvas.persistent.workpad;
      const currentScene =
        canvas.transient.aeroelastic ||
        reduxToAero({ elements: workpad.pages[workpad.page].elements });
      const aeroelastic = nextScene({ currentScene, primaryUpdate: payload });

      /**
       * Settig aero selection in canvas
       */

      let canvasSelectedElement;
      let setCanvasSelectedElement = false;
      const shapes = currentScene.shapes;

      // set the selected element on the global store, if one element is selected

      const selectedElement = getSelectedElement(canvas);
      const selectedShape = currentScene.selectedPrimaryShapes[0];
      if (currentScene.selectedShapes.length === 1 && !isGroupId(selectedShape)) {
        if (selectedShape !== (selectedElement && selectedElement.id)) {
          canvasSelectedElement = selectedShape;
          setCanvasSelectedElement = true;
        }
      } else {
        // otherwise, clear the selected element state
        // even for groups - TODO add handling for groups, esp. persistent groups - common styling etc.
        if (selectedElement) {
          const shape = shapes.find(s => s.id === selectedShape);
          // don't reset if eg. we're in the middle of converting an ad hoc group into a persistent one
          if (!shape || shape.subtype !== 'adHocGroup') {
            canvasSelectedElement = null;
            setCanvasSelectedElement = true;
          }
        }
      }

      return {
        ...canvas,
        transient: {
          ...canvas.transient,
          ...(setCanvasSelectedElement && { selectedElement: canvasSelectedElement }),
          aeroelastic,
        },
      };
    },
  },
  {}
);
