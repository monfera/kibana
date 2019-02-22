/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withHandlers, withProps /*, withState*/ } from 'recompose';
import { canUserWrite, getFullscreen } from '../../state/selectors/app';
import { getNodes, isWriteable } from '../../state/selectors/workpad';
import { nextScene } from '../../lib/aeroelastic/layout';
import {
  addElement,
  elementLayer,
  insertNodes,
  removeElements,
  setMultiplePositions,
} from '../../state/actions/elements';
import { selectElement, setAeroelastic } from './../../state/actions/transient';
import {
  componentLayoutLocalState,
  isSelectedAnimation,
  makeUid,
  reduxToAero,
  shapeToElement,
  updateGlobalPositions,
} from './aeroelastic_redux_helpers';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as Component } from './workpad_page';

const mapStateToProps = (state, ownProps) => {
  const elements = getNodes(state, ownProps.page.id);
  return {
    isEditable: !getFullscreen(state) && isWriteable(state) && canUserWrite(state),
    elements,
    aeroelastic: state.transient.aeroelastic || reduxToAero({ elements }),
  };
};

const mapDispatchToProps = dispatch => ({
  insertNodes: pageId => selectedElements => dispatch(insertNodes(selectedElements, pageId)),
  removeElements: pageId => elementIds => dispatch(removeElements(elementIds, pageId)),
  addElement: pageId => element => dispatch(addElement(pageId, element)),
  setMultiplePositions: positions => dispatch(setMultiplePositions(positions)),
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
  setAeroelastic: newState => dispatch(setAeroelastic(newState)),
});

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
  //withState('handlers', 'setHandlers', calculateHandlers),
  withProps(props => {
    const {
      aeroelastic,
      setAeroelastic,
      handlers /*setHandlers,*/,
      page,
      elements,
      addElement,
      setMultiplePositions,
      removeElements,
    } = props;
    const previousAeroelasticState = aeroelastic;
    const { shapes, cursor } = previousAeroelasticState;
    const elementLookup = new Map(elements.map(element => [element.id, element]));
    const shapesToRender = shapes.map(shape => {
      const pageElement = elementLookup.has(shape.id) && elementLookup.get(shape.id);
      // instead of just combining `pageElement` with `shape`, we make property transfer explicit
      return {
        ...(pageElement ? { ...shape, filter: pageElement.filter } : shape),
        width: shape.a * 2,
        height: shape.b * 2,
      };
    });
    return {
      elements: shapesToRender,
      cursor,
      commit: (type, payload) => {
        const uid = makeUid();
        const newScenePrep = {
          currentScene: aeroelastic,
          primaryUpdate: { type, payload: { ...payload, uid } },
        };
        setAeroelastic(nextScene(newScenePrep));
        if (0) {
          setAeroelastic(state => {
            const previousAeroelasticState = state;
            const reduxSyncedAeroelasticState = previousAeroelasticState || {
              ...previousAeroelasticState,
              currentScene: {
                ...previousAeroelasticState.currentScene,
                shapes: componentLayoutLocalState({ elements }).currentScene.shapes.concat(
                  previousAeroelasticState.currentScene.shapes.filter(s => s.type === 'annotation')
                ),
              },
            };

            const currentScene = nextScene({
              ...reduxSyncedAeroelasticState,
              primaryUpdate: { type, payload: { ...payload, uid: makeUid() } },
            });
            if (false && currentScene.gestureEnd) {
              // annotations don't need Redux persisting
              const primaryShapes = currentScene.shapes.filter(
                shape => shape.type !== 'annotation'
              );

              // persistent groups
              const persistableGroups = primaryShapes.filter(s => s.subtype === 'persistentGroup');

              // remove all group elements
              const elementsToRemove = elements.filter(
                e => e.position.type === 'group' && !persistableGroups.find(p => p.id === e.id)
              );
              if (elementsToRemove.length) {
                removeElements(page.id)(elementsToRemove.map(e => e.id));
              }

              // create all needed groups
              persistableGroups
                .filter(p => !elements.find(e => p.id === e.id))
                .forEach(g => {
                  const partialElement = {
                    id: g.id,
                    filter: undefined,
                    expression: 'shape fill="rgba(255,255,255,0)" | render', // https://github.com/elastic/kibana/pull/28796
                    position: shapeToElement(g),
                  };
                  addElement(page.id)(partialElement);
                });

              // update the position of possibly changed elements
              updateGlobalPositions(
                positions =>
                  setMultiplePositions(
                    positions.map(p => ({
                      ...p,
                      pageId: page.id,
                    }))
                  ),
                currentScene,
                elements
              );

              // handlers can only change if there's change to Redux (checked by proxy of putting it in
              // the if(currentScene.gestureEnd) {...}
              // todo consider somehow putting it in or around `connect`, to more directly tie it to Redux change
              /*setHandlers(() =>
                calculateHandlers({
                  aeroelastic,
                  page,
                  insertNodes,
                  removeElements,
                  selectElement,
                  elementLayer,
                })
              )*/
            }

            return {
              ...state,
              currentScene,
            };
          });
        }
      },
      ...handlers,
    };
  }), // Updates states; needs to have both local and global
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
  withHandlers(eventHandlers) // Captures user intent, needs to have reconciled state
)(Component);

WorkpadPage.propTypes = {
  page: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};
