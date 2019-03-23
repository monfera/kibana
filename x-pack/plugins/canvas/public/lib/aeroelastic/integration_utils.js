/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { shallowEqual } from 'recompose';
import { aeroelastic as aero } from '../aeroelastic_kibana';
import { getNodes, getSelectedElement, getSelectedPage } from '../../state/selectors/workpad';
import { addElement, removeElements, setMultiplePositions } from '../../state/actions/elements';
import { selectElement } from '../../state/actions/transient';
import { matrixToAngle } from './matrix';
import { arrayToMap, flatten, identity } from './functional';
import { getLocalTransformMatrix } from './layout_functions';
import { createLayoutStore } from './index';

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
export const isGroupId = id => id.startsWith(aeroelasticConfiguration.groupName);

/**
 * elementToShape
 *
 * converts a `kibana-canvas` element to an `aeroelastic` shape.
 *
 * Shape: the layout algorithms need to deal with objects through their geometric properties, excluding other aspects,
 * such as what's inside the element, eg. image or scatter plot. This representation is, at its core, a transform matrix
 * that establishes a new local coordinate system https://drafts.csswg.org/css-transforms/#local-coordinate-system plus a
 * size descriptor. There are two versions of the transform matrix:
 *   - `transformMatrix` is analogous to the SVG https://drafts.csswg.org/css-transforms/#current-transformation-matrix
 *   - `localTransformMatrix` is analogous to the SVG https://drafts.csswg.org/css-transforms/#transformation-matrix
 *
 * Element: it also needs to represent the geometry, primarily because of the need to persist it in `redux` and on the
 * server, and to accept such data from the server. The redux and server representations will need to change as more general
 * projections such as 3D are added. The element also needs to maintain its content, such as an image or a plot.
 *
 * While all elements on the current page also exist as shapes, there are shapes that are not elements: annotations.
 * For example, `rotation_handle`, `border_resize_handle` and `border_connection` are modeled as shapes by the layout
 * library, simply for generality.
 */
export const elementToShape = (element, i) => {
  const position = element.position;
  const a = position.width / 2;
  const b = position.height / 2;
  const cx = position.left + a;
  const cy = position.top + b;
  const z = i; // painter's algo: latest item goes to top
  // multiplying the angle with -1 as `transform: matrix3d` uses a left-handed coordinate system
  const angleRadians = (-position.angle / 180) * Math.PI;
  const transformMatrix = aero.matrix.multiply(
    aero.matrix.translate(cx, cy, z),
    aero.matrix.rotateZ(angleRadians)
  );
  const isGroup = isGroupId(element.id);
  const parent = (element.position && element.position.parent) || null; // reserved for hierarchical (tree shaped) grouping
  return {
    id: element.id,
    type: isGroup ? 'group' : 'rectangleElement',
    subtype: isGroup ? 'persistentGroup' : '',
    parent,
    transformMatrix,
    a, // we currently specify half-width, half-height as it leads to
    b, // more regular math (like ellipsis radii rather than diameters)
  };
};

const shapeToElement = shape => {
  return {
    left: shape.transformMatrix[12] - shape.a,
    top: shape.transformMatrix[13] - shape.b,
    width: shape.a * 2,
    height: shape.b * 2,
    angle: Math.round((matrixToAngle(shape.transformMatrix) * 180) / Math.PI),
    parent: shape.parent || null,
    type: shape.type === 'group' ? 'group' : 'element',
  };
};

const globalPositionUpdates = (setMultiplePositions, { shapes, gestureEnd }, unsortedElements) => {
  const ascending = (a, b) => (a.id < b.id ? -1 : 1);
  const relevant = s => s.type !== 'annotation' && s.subtype !== 'adHocGroup';
  const elements = unsortedElements.filter(relevant).sort(ascending);
  const repositionings = shapes
    .filter(relevant)
    .sort(ascending)
    .map((shape, i) => {
      const element = elements[i];
      const elemPos = element && element.position;
      if (elemPos && gestureEnd) {
        // get existing position information from element
        const oldProps = {
          left: elemPos.left,
          top: elemPos.top,
          width: elemPos.width,
          height: elemPos.height,
          angle: Math.round(elemPos.angle),
          type: elemPos.type,
          parent: elemPos.parent || null,
        };

        // cast shape into element-like object to compare
        const newProps = shapeToElement(shape);

        if (1 / newProps.angle === -Infinity) {
          newProps.angle = 0;
        } // recompose.shallowEqual discerns between 0 and -0

        return shallowEqual(oldProps, newProps)
          ? null
          : { position: newProps, elementId: shape.id };
      }
    })
    .filter(identity);
  return repositionings;
};

const deduped = a => a.filter((d, i) => a.indexOf(d) === i);

export const idDuplicateCheck = groups => {
  if (deduped(groups.map(g => g.id)).length !== groups.length) {
    throw new Error('Duplicate element encountered');
  }
};

const missingParentCheck = groups => {
  const idMap = arrayToMap(groups.map(g => g.id));
  groups.forEach(g => {
    if (g.parent && !idMap[g.parent]) {
      g.parent = null;
    }
  });
};

export const shapesForNodes = nodes => {
  const rawShapes = nodes
    .map(elementToShape)
    // filtering to eliminate residual element of a possible group that had been deleted in Redux
    .filter((d, i, a) => !isGroupId(d.id) || a.find(s => s.parent === d.id));
  idDuplicateCheck(rawShapes);
  missingParentCheck(rawShapes);
  const getLocalMatrix = getLocalTransformMatrix(rawShapes);
  return rawShapes.map(s => ({ ...s, localTransformMatrix: getLocalMatrix(s) }));
};

const updateGlobalPositionsInRedux = (setMultiplePositions, scene, unsortedElements) => {
  const repositionings = globalPositionUpdates(setMultiplePositions, scene, unsortedElements);
  if (repositionings.length) {
    setMultiplePositions(repositionings);
  }
};

export const globalStateUpdater = (dispatch, getState) => state => {
  const nextScene = state.currentScene;
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
      !persistableGroups.find(g => p.id === g.id) || !elements.find(e => e.position.parent === p.id)
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

const recurseGroupTree = shapes => shapeId => {
  const recurseGroupTreeInternal = shapeId => {
    return [
      shapeId,
      ...flatten(
        shapes
          .filter(s => s.parent === shapeId && s.type !== 'annotation')
          .map(s => s.id)
          .map(recurseGroupTreeInternal)
      ),
    ];
  };
  return recurseGroupTreeInternal(shapeId);
};

export const layoutEngine = ({ elements, updateGlobalState, aeroStore, setAeroStore }) => {
  const scene = aeroStore.getCurrentState().currentScene;
  const shapes = scene.shapes;
  const selectedPrimaryShapes = scene.selectedPrimaryShapes || [];
  const cursor = scene.cursor;
  const elementLookup = new Map(elements.map(element => [element.id, element]));
  const selectedPrimaryShapeObjects = selectedPrimaryShapes
    .map(id => shapes.find(s => s.id === id))
    .filter(shape => shape);
  const selectedPersistentPrimaryShapes = flatten(
    selectedPrimaryShapeObjects.map(shape =>
      shape.subtype === 'adHocGroup'
        ? shapes.filter(s => s.parent === shape.id && s.type !== 'annotation').map(s => s.id)
        : [shape.id]
    )
  );
  const selectedElementIds = flatten(selectedPersistentPrimaryShapes.map(recurseGroupTree(shapes)));
  const selectedElements = [];
  const elementsToRender = shapes.map(shape => {
    let element = null;
    if (elementLookup.has(shape.id)) {
      element = elementLookup.get(shape.id);
      if (selectedElementIds.indexOf(shape.id) > -1) {
        selectedElements.push({ ...element, id: shape.id });
      }
    }
    // instead of just combining `element` with `shape`, we make property transfer explicit
    const result = element
      ? { ...shape, width: shape.a * 2, height: shape.b * 2, filter: element.filter }
      : shape;
    const { id, filter, type, subtype, width, height, transformMatrix, text } = result;
    return { id, filter, type, subtype, width, height, transformMatrix, text };
  });
  return {
    elements: elementsToRender,
    cursor,
    selectedElementIds,
    selectedElements,
    selectedPrimaryShapes,
    commit: (type, payload) => {
      const newLayoutState = aeroStore.commit(type, payload);
      if (newLayoutState.currentScene.gestureEnd) {
        updateGlobalState(newLayoutState);
      } else {
        setAeroStore(aeroStore => aeroStore); // fixme remove this hack
      }
    },
  };
};

export const calcNextStateFromRedux = (store, shapes, selectedElement) => {
  const selectedShapeObjects = [selectedElement]
    .map(e => shapes.find(s => s.id === e))
    .filter(s => s);

  const prevSelectionState = (store && store.currentScene && store.currentScene.selectionState) || {
    shapes: [],
    uid: Math.round(1000000000 * Math.random()),
    depthIndex: 0,
    down: false,
  };
  return createLayoutStore({
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
};
