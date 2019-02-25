/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withHandlers, withProps } from 'recompose';
import { getNodes } from '../../state/selectors/workpad';
import { flatten } from '../../lib/aeroelastic/functional';
import { elementLayer, insertNodes, removeElements } from '../../state/actions/elements';
import { commitAeroelastic } from './../../state/actions/canvas';
import { isSelectedAnimation, makeUid, reduxToAero } from './aeroelastic_redux_helpers';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as Component } from './workpad_page';
import { selectElement } from './../../state/actions/transient';

const mapStateToProps = (state, ownProps) => {
  const elements = getNodes(state, ownProps.page.id);
  return {
    isEditable: true,
    elements,
    aeroelastic: state.transient.aeroelastic || reduxToAero(elements),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    commitAeroelastic: aeroAction => dispatch(commitAeroelastic(aeroAction)),
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

export const WorkpadPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    undefined,
    {
      //pure: true,
      /*
      areStatesEqual: (next, prev) => {
        return false;
      },
*/
    }
  ),
  withProps(isSelectedAnimation),
  withProps(props => {
    const { aeroelastic, commitAeroelastic, handlers, elements } = props;
    const { shapes, selectedPrimaryShapes = [], cursor } = aeroelastic;

    const recurseGroupTree = shapeId => {
      return [
        shapeId,
        ...flatten(
          shapes
            .filter(s => s.parent === shapeId && s.type !== 'annotation')
            .map(s => s.id)
            .map(recurseGroupTree)
        ),
      ];
    };

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
    const selectedElementIds = flatten(selectedPersistentPrimaryShapes.map(recurseGroupTree));

    const selectedElements = [];
    const elementLookup = new Map(elements.map(element => [element.id, element]));
    const pageElements = shapes.map(shape => {
      let element = null;
      if (elementLookup.has(shape.id)) {
        element = elementLookup.get(shape.id);
        if (selectedElementIds.indexOf(shape.id) > -1) {
          selectedElements.push({ ...element, id: shape.id });
        }
      }
      // instead of just combining `element` with `shape`, we make property transfer explicit
      return element ? { ...shape, filter: element.filter } : shape;
    });

    return {
      className: 'canvasPage--isActive',
      elements: pageElements,
      cursor,
      selectedElementIds,
      selectedElements,
      selectedPrimaryShapes,
      commit: (type, payload) =>
        commitAeroelastic({ type, payload: { ...payload, uid: makeUid() } }),
      ...handlers,
    };
  }),
  withHandlers(eventHandlers)
)(Component);

WorkpadPage.propTypes = {
  page: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};
