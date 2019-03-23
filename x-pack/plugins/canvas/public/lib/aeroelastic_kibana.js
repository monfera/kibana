/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createLayoutStore, matrix } from './aeroelastic';

let store;

export const aeroelasticConfiguration = {
  getAdHocChildAnnotationName: 'adHocChildAnnotation',
  adHocGroupName: 'adHocGroup',
  alignmentGuideName: 'alignmentGuide',
  atopZ: 1000,
  depthSelect: true,
  devColor: 'magenta',
  groupName: 'group',
  groupResize: true,
  guideDistance: 3,
  hoverAnnotationName: 'hoverAnnotation',
  hoverLift: 100,
  intraGroupManipulation: false,
  intraGroupSnapOnly: false,
  minimumElementSize: 2,
  persistentGroupName: 'persistentGroup',
  resizeAnnotationConnectorOffset: 0,
  resizeAnnotationOffset: 0,
  resizeAnnotationOffsetZ: 0.1, // causes resize markers to be slightly above the shape plane
  resizeAnnotationSize: 10,
  resizeConnectorName: 'resizeConnector',
  resizeHandleName: 'resizeHandle',
  rotateAnnotationOffset: 12,
  rotateSnapInPixels: 10,
  rotationEpsilon: 0.001,
  rotationHandleName: 'rotationHandle',
  rotationHandleSize: 14,
  rotationTooltipName: 'rotationTooltip',
  shortcuts: false,
  singleSelect: false,
  snapConstraint: true,
  tooltipZ: 1100,
};

export const aeroelastic = {
  matrix,

  setStore(shapes, selectedElement) {
    const selectedShapeObjects = [selectedElement]
      .map(e => shapes.find(s => s.id === e))
      .filter(s => s);

    const prevSelectionState = (store &&
      store.currentScene &&
      store.currentScene.selectionState) || {
      shapes: [],
      uid: Math.round(1000000000 * Math.random()),
      depthIndex: 0,
      down: false,
    };
    store = createLayoutStore({
      primaryUpdate: null,
      currentScene: {
        shapes,
        configuration: aeroelasticConfiguration,
        selectedShapes: [selectedElement],
        selectedLeafShapes: [selectedElement],
        selectedPrimaryShapes: [selectedElement],
        selectedShapeObjects,
        selectionState: {
          shapes: selectedShapeObjects,
          uid: prevSelectionState.uid, // + 1,
          ...prevSelectionState,
        },
      },
    });
  },

  getStore() {
    return store;
  },

  commit(...args) {
    return store.commit(...args);
  },
};
