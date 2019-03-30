/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { branch, compose, withHandlers, withProps, withState } from 'recompose';
import { elementLayer, insertNodes, removeElements } from '../../state/actions/elements';
import { canUserWrite, getFullscreen } from '../../state/selectors/app';
import { getNodes, getNodesForPage, getPages, isWriteable } from '../../state/selectors/workpad';
import {
  elementToShape,
  globalStateUpdater,
  shapesForNodes,
} from '../../lib/aeroelastic/integration_utils';
import { updater } from '../../lib/aeroelastic/layout';
import { createStore } from '../../lib/aeroelastic/store';
import { flatten } from '../../lib/aeroelastic/functional';
import { eventHandlers } from './event_handlers';
import { InteractiveWorkpadPage as InteractiveComponent } from './interactive_workpad_page';
import { StaticWorkpadPage as StaticComponent } from './static_workpad_page';
import { selectElement } from './../../state/actions/transient';

const recurseGroupTree = shapes => shapeId => {
  const recurseGroupTreeInternal = shapeId => {
    return [
      shapeId,
      ...flatten(
        shapes
          .filter(s => s.position.parent === shapeId)
          .map(s => s.id)
          .map(recurseGroupTreeInternal)
      ),
    ];
  };
  return recurseGroupTreeInternal(shapeId);
};

const configuration = {
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

const animationProps = ({ isSelected, animation }) => {
  function getClassName() {
    if (animation) {
      return animation.name;
    }
    return isSelected ? 'canvasPage--isActive' : 'canvasPage--isInactive';
  }

  function getAnimationStyle() {
    if (!animation) {
      return {};
    }
    return {
      animationDirection: animation.direction,
      // TODO: Make this configurable
      animationDuration: '1s',
    };
  }

  return {
    className: getClassName(),
    animationStyle: getAnimationStyle(),
  };
};

const simplePositioning = ({ elements }) => ({
  elements: elements.map((element, i) => {
    const { type, subtype, transformMatrix } = elementToShape(element, i);
    return {
      id: element.id,
      filter: element.filter,
      width: element.position.width,
      height: element.position.height,
      type,
      subtype,
      transformMatrix,
    };
  }),
});

const groupHandlerCreators = {
  groupElements: ({ commit }) => () =>
    commit('actionEvent', {
      event: 'group',
    }),
  ungroupElements: ({ commit }) => () =>
    commit('actionEvent', {
      event: 'ungroup',
    }),
};

const StaticPage = compose(
  withProps(simplePositioning),
  () => StaticComponent
);

const mapStateToProps = (state, ownProps) => {
  const selectedPrimaryShapes = [state.transient.selectedElement].filter(e => e);
  const nodes = getNodes(state, ownProps.page.id);
  const shapes = nodes;
  const selectedPrimaryShapeObjects = selectedPrimaryShapes
    .map(id => shapes.find(s => s.id === id))
    .filter(shape => shape);
  const selectedPersistentPrimaryNodes = flatten(
    selectedPrimaryShapeObjects.map(shape =>
      nodes.find(n => n.id === shape.id) // is it a leaf or a persisted group?
        ? [shape.id]
        : shapes.filter(s => s.parent === shape.id).map(s => s.id)
    )
  );
  const selectedElementIds = flatten(selectedPersistentPrimaryNodes.map(recurseGroupTree(shapes)));
  return {
    state,
    isEditable: !getFullscreen(state) && isWriteable(state) && canUserWrite(state),
    elements: nodes,
    selectedPrimaryShapes,
    selectedElementIds,
    selectedElements: selectedElementIds.map(id => nodes.find(s => s.id === id)),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatch,
    insertNodes: pageId => selectedElements => dispatch(insertNodes(selectedElements, pageId)),
    removeElements: pageId => elementIds => dispatch(removeElements(elementIds, pageId)),
    selectElement: selectedElement => dispatch(selectElement(selectedElement)),
    // TODO: Abstract this out. This is the same code as in sidebar/index.js
    elementLayer: (pageId, selectedElement, movement) => {
      dispatch(
        elementLayer({
          pageId,
          elementId: selectedElement.id,
          movement,
        })
      );
    },
  };
};

const mergeProps = (
  { state, isEditable, elements, ...restStateProps },
  { dispatch, ...restDispatchProps },
  { isSelected, ...remainingOwnProps }
) =>
  isEditable && isSelected
    ? {
        elements,
        isInteractive: true,
        isSelected,
        ...remainingOwnProps,
        ...restDispatchProps,
        ...restStateProps,
        updateGlobalState: globalStateUpdater(dispatch, () => state),
        state,
      }
    : { elements, isSelected, isInteractive: false, ...remainingOwnProps };

const componentLayoutState = ({ state, aeroStore, setAeroStore }) => {
  const shapes = shapesForNodes(getNodesForPage(getPages(state)[state.persistent.workpad.page]));
  const selectedShapes = [state.transient.selectedElement].filter(
    e => e && shapes.find(s => s.id === e)
  );
  const newState = {
    primaryUpdate: null,
    currentScene: {
      shapes,
      configuration,
      selectedShapes,
      selectionState: aeroStore
        ? aeroStore.getCurrentState().currentScene.selectionState
        : { uid: 0, depthIndex: 0, down: false },
      gestureState: aeroStore
        ? aeroStore.getCurrentState().currentScene.gestureState
        : {
            cursor: { x: 0, y: 0 },
            mouseIsDown: false,
            mouseButtonState: { buttonState: 'up', downX: null, downY: null },
          },
    },
  };
  if (aeroStore) {
    aeroStore.setCurrentState(newState);
  } else {
    setAeroStore((aeroStore = createStore(newState, updater)));
  }
  return { aeroStore };
};

const InteractivePage = compose(
  withProps(componentLayoutState),
  withState('canvasOrigin', 'saveCanvasOrigin'),
  withState('_forceRerender', 'forceRerender'),
  withProps(({ aeroStore, updateGlobalState, forceRerender }) => ({
    commit: (type, payload) => {
      const newLayoutState = aeroStore.commit(type, payload);
      if (newLayoutState.currentScene.gestureEnd) {
        updateGlobalState(newLayoutState);
      } else {
        forceRerender();
      }
    },
  })),
  withProps(({ aeroStore }) => ({ cursor: aeroStore.getCurrentState().currentScene.cursor })),
  withProps(({ aeroStore, elements }) => {
    const elementLookup = new Map(elements.map(element => [element.id, element]));
    const elementsToRender = aeroStore.getCurrentState().currentScene.shapes.map(shape => {
      const element = elementLookup.get(shape.id);
      return element
        ? { ...shape, width: shape.a * 2, height: shape.b * 2, filter: element.filter }
        : shape;
    });
    return { elements: elementsToRender };
  }),
  withHandlers(groupHandlerCreators),
  withHandlers(eventHandlers), // Captures user intent, needs to have reconciled state
  () => InteractiveComponent
);

export const WorkpadPage = compose(
  withState('aeroStore', 'setAeroStore'), // must wrap `connect`, though only interactive pages end up using it
  withProps(animationProps),
  connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  ),
  branch(({ isInteractive }) => isInteractive, InteractivePage, StaticPage)
)();

WorkpadPage.propTypes = {
  page: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};
