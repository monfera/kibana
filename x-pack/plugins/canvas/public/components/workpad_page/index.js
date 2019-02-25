/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { getNodes } from '../../state/selectors/workpad';
import { flatten } from '../../lib/aeroelastic/functional';
import { multiply, rotateZ, translate } from '../../lib/aeroelastic/matrix';
import { elementLayer, insertNodes, removeElements } from '../../state/actions/elements';
import { commitAeroelastic } from './../../state/actions/canvas';
import { isSelectedAnimation, makeUid, reduxToAero } from './aeroelastic_redux_helpers';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as Component } from './workpad_page';
import { selectElement } from './../../state/actions/transient';
import { nextAeroScene } from '../../state/reducers/canvas';
import { nextScene } from '../../lib/aeroelastic/layout';
import { persistAeroelastic } from '../../state/actions/canvas';

const mapStateToProps = (state, ownProps) => {
  const pageId = ownProps.page.id;
  const pageIndex = state.persistent.workpad.pages.findIndex(p => p.id === pageId);
  const elements = getNodes(state, pageId);
  const reduxPageIndex = state.persistent.workpad.page;
  if (0)
    console.log(
      'mapStateToProps says: pageId, pageIndex, reduxPageIndex:',
      pageId,
      pageIndex,
      reduxPageIndex
    );
  return {
    isEditable: true,
    elements,
    ownPropsPageIndex: pageIndex,
    reduxPageIndex: reduxPageIndex,
    aeroelastic: state.transient.aeroelastic || reduxToAero(elements),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    commitAeroelastic: aeroAction => dispatch(commitAeroelastic(aeroAction)),
    persistAeroelastic: scene => dispatch(persistAeroelastic(scene)),
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
  withState('localAero', 'setLocalAero', ({ aeroelastic }) => aeroelastic),
  withProps(props => {
    const {
      aeroelastic,
      localAero,
      setLocalAero,
      commitAeroelastic,
      persistAeroelastic,
      handlers,
      elements,
      ownPropsPageIndex,
      reduxPageIndex,
    } = props;

    const { shapes, selectedPrimaryShapes = [], cursor } = localAero;

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
    const pageElements =
      true && true
        ? shapes.map(shape => {
            let element = null;
            if (elementLookup.has(shape.id)) {
              element = elementLookup.get(shape.id);
              if (selectedElementIds.indexOf(shape.id) > -1) {
                selectedElements.push({ ...element, id: shape.id });
              }
            }
            // instead of just combining `element` with `shape`, we make property transfer explicit
            return element ? { ...shape, filter: element.filter } : shape;
          })
        : elements.map((element, i) => {
            const position = element.position;
            const width = position.width;
            const a = width / 2;
            const height = position.height;
            const b = height / 2;
            const cx = position.left + a;
            const cy = position.top + b;
            const z = i; // painter's algo: latest item goes to top
            // multiplying the angle with -1 as `transform: matrix3d` uses a left-handed coordinate system
            const angleRadians = (-position.angle / 180) * Math.PI;
            const transformMatrix = multiply(translate(cx, cy, z), rotateZ(angleRadians));
            return { id: element.id, width, height, transformMatrix };
          });

    return {
      className: 'canvasPage--isActive',
      elements: pageElements,
      cursor,
      selectedElementIds,
      selectedElements,
      selectedPrimaryShapes,
      commit: (type, payload) => {
        if (reduxPageIndex === ownPropsPageIndex) {
          setLocalAero(localAero => {
            const aeroAction = { type, payload: { ...payload, uid: makeUid() } };
            const newScene = nextScene({
              currentScene: localAero,
              primaryUpdate: aeroAction,
            });
            if (newScene.gestureEnd) {
              persistAeroelastic(newScene);
            }
            return newScene;
          });
        }
      },
      ...handlers,
    };
  }),
  withHandlers({
    groupElements: ({ commit }) => () =>
      commit('actionEvent', {
        event: 'group',
      }),
    ungroupElements: ({ commit }) => () =>
      commit('actionEvent', {
        event: 'ungroup',
      }),
  }),
  withHandlers(eventHandlers)
)(Component);

WorkpadPage.propTypes = {
  page: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};
