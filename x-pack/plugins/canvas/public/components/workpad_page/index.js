/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { branch, compose, withHandlers, withProps, withState } from 'recompose';
import { aeroelastic } from '../../lib/aeroelastic_kibana';
import { elementLayer, insertNodes, removeElements } from '../../state/actions/elements';
import { canUserWrite, getFullscreen } from '../../state/selectors/app';
import { getNodes, isWriteable } from '../../state/selectors/workpad';
import {
  elementToShape,
  globalStateUpdater,
  layoutEngine,
} from '../../lib/aeroelastic/integration_utils';
import { eventHandlers } from './event_handlers';
import { InteractiveWorkpadPage as InteractiveComponent } from './interactive_workpad_page';
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
        aeroStore: aeroelastic.getStore(),
        aeroCommit: aeroelastic.commit,
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
