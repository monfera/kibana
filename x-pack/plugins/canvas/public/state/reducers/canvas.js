/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { handleActions } from 'redux-actions';
import { commitAeroelastic } from '../actions/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import { reduxToAero } from '../../components/workpad_page/aeroelastic_redux_helpers';

export const canvasReducer = handleActions(
  {
    [commitAeroelastic]: (canvas, { payload }) => {
      const workpad = canvas.persistent.workpad;
      const currentScene =
        canvas.transient.aeroelastic ||
        reduxToAero({ elements: workpad.pages[workpad.page].elements });
      const aeroelastic = nextScene({ currentScene, primaryUpdate: payload });
      return {
        ...canvas,
        transient: {
          ...canvas.transient,
          aeroelastic,
        },
      };
    },
  },
  {}
);
