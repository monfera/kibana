/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withState, withProps, withHandlers, branch } from 'recompose';
import { aeroelastic } from '../../lib/aeroelastic_kibana';
import { removeElements, insertNodes, elementLayer } from '../../state/actions/elements';
import { getFullscreen, canUserWrite } from '../../state/selectors/app';
import { getNodes, isWriteable } from '../../state/selectors/workpad';
import { flatten } from '../../lib/aeroelastic/functional';
import { elementToShape, globalStateUpdater } from '../../lib/aeroelastic/integration_utils';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as InteractiveComponent } from './workpad_page';
import { StaticWorkpadPage as StaticComponent } from './static_workpad_page';
import { selectElement } from './../../state/actions/transient';

const mapStateToProps = (state, ownProps) => {
  return {
    state,
    isEditable: !getFullscreen(state) && isWriteable(state) && canUserWrite(state),
    elements: getNodes(state, ownProps.page.id),
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
  { state, isEditable, elements },
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
        updateGlobalState: globalStateUpdater(dispatch, () => state),
      }
    : { elements, isSelected, isInteractive: false, ...remainingOwnProps };

const getRootElementId = (lookup, id) => {
  if (!lookup.has(id)) {
    return null;
  }

  const element = lookup.get(id);
  return element.parent && element.parent.subtype !== 'adHocGroup'
    ? getRootElementId(lookup, element.parent)
    : element.id;
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

const layoutEngine = ({ forceUpdate, elements, updateGlobalState }) => {
  const aeroStore = aeroelastic.getStore();
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
      const newLayoutState = aeroelastic.commit(type, payload);
      if (newLayoutState.currentScene.gestureEnd) {
        updateGlobalState(newLayoutState);
      } else {
        forceUpdate();
      }
    },
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

const InteractivePage = compose(
  withState('_forceUpdate', 'forceUpdate'), // TODO: phase out this solution
  withState('canvasOrigin', 'saveCanvasOrigin'),
  withProps(layoutEngine), // Updates states; needs to have both local and global
  withHandlers(groupHandlerCreators),
  withHandlers(eventHandlers), // Captures user intent, needs to have reconciled state
  () => InteractiveComponent
);

const StaticPage = compose(
  withProps(simplePositioning),
  () => StaticComponent
);

export const WorkpadPage = compose(
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
