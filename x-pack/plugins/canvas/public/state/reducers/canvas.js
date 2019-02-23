/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { handleActions } from 'redux-actions';
import { commitAeroelastic } from '../actions/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import { reduxToAero } from '../../components/workpad_page/aeroelastic_redux_helpers';

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
      return {
        ...canvas,
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
