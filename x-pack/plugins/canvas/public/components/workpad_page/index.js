/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { notify } from '../../lib/notify';
import { getClipboardData, setClipboardData } from '../../lib/clipboard';
import { cloneSubgraphs } from '../../lib/clone_subgraphs';
import { canUserWrite, getFullscreen } from '../../state/selectors/app';
import { getNodes, isWriteable } from '../../state/selectors/workpad';
import { flatten } from '../../lib/aeroelastic/functional';
import { nextScene } from '../../lib/aeroelastic/layout';
import {
  addElement,
  elementLayer,
  insertNodes,
  removeElements,
  setMultiplePositions,
} from '../../state/actions/elements';
import {
  componentLayoutLocalState,
  makeUid,
  reduxToAero,
  shapeToElement,
  updateGlobalPositions,
} from './aeroelastic_redux_helpers';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as Component } from './workpad_page';
import { selectElement } from './../../state/actions/transient';
import { setAeroelastic } from '../../state/actions/transient';

const mapStateToProps = (state, ownProps) => {
  const elements = getNodes(state, ownProps.page.id);
  return {
    isEditable: !getFullscreen(state) && isWriteable(state) && canUserWrite(state),
    elements,
    globalState: state,
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

const isSelectedAnimation = ({ isSelected, animation }) => {
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

const calculateHandlers = ({
  aeroelastic,
  page,
  insertNodes,
  removeElements,
  selectElement,
  elementLayer,
}) => {
  const { shapes, selectedPrimaryShapes = [] } = aeroelastic;
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

  const selectedPrimaryShapeObjects = selectedPrimaryShapes.map(id =>
    shapes.find(s => s.id === id)
  );
  const selectedPersistentPrimaryShapes = flatten(
    selectedPrimaryShapeObjects.map(shape =>
      shape.subtype === 'adHocGroup'
        ? shapes.filter(s => s.parent === shape.id && s.type !== 'annotation').map(s => s.id)
        : [shape.id]
    )
  );
  const selectedElementIds = flatten(selectedPersistentPrimaryShapes.map(recurseGroupTree));
  const selectedElements = [];
  return {
    removeElements: () => {
      // currently, handle the removal of one element, exploiting multiselect subsequently
      if (selectedElementIds.length) {
        removeElements(page.id)(selectedElementIds);
      }
    },
    copyElements: () => {
      if (selectedElements.length) {
        setClipboardData({ selectedElements, rootShapes: selectedPrimaryShapes });
        notify.success('Copied element to clipboard');
      }
    },
    cutElements: () => {
      if (selectedElements.length) {
        setClipboardData({ selectedElements, rootShapes: selectedPrimaryShapes });
        removeElements(page.id)(selectedElementIds);
        notify.success('Copied element to clipboard');
      }
    },
    // TODO: This is slightly different from the duplicateElements function in sidebar/index.js. Should they be doing the same thing?
    // This should also be abstracted.
    duplicateElements: () => {
      const clonedElements = selectedElements && cloneSubgraphs(selectedElements);
      if (clonedElements) {
        insertNodes(page.id)(clonedElements);
        if (selectedPrimaryShapes.length) {
          if (selectedElements.length > 1) {
            // adHocGroup branch (currently, pasting will leave only the 1st element selected, rather than forming a
            // new adHocGroup - todo)
            selectElement(clonedElements[0].id);
          } else {
            // single element or single persistentGroup branch
            selectElement(
              clonedElements[selectedElements.findIndex(s => s.id === selectedPrimaryShapes[0])].id
            );
          }
        }
      }
    },
    pasteElements: () => {
      const { selectedElements, rootShapes } = JSON.parse(getClipboardData()) || {};
      const clonedElements = selectedElements && cloneSubgraphs(selectedElements);
      if (clonedElements) {
        // first clone and persist the new node(s)
        insertNodes(page.id)(clonedElements);
        // then select the cloned node
        if (rootShapes.length) {
          if (selectedElements.length > 1) {
            // adHocGroup branch (currently, pasting will leave only the 1st element selected, rather than forming a
            // new adHocGroup - todo)
            selectElement(clonedElements[0].id);
          } else {
            // single element or single persistentGroup branch
            selectElement(
              clonedElements[selectedElements.findIndex(s => s.id === rootShapes[0])].id
            );
          }
        }
      }
    },
    // TODO: Same as above. Abstract these out. This is the same code as in sidebar/index.js
    // Note: these layer actions only work when a single element is selected
    bringForward: () =>
      selectedElements.length === 1 && elementLayer(page.id, selectedElements[0], 1),
    bringToFront: () =>
      selectedElements.length === 1 && elementLayer(page.id, selectedElements[0], Infinity),
    sendBackward: () =>
      selectedElements.length === 1 && elementLayer(page.id, selectedElements[0], -1),
    sendToBack: () =>
      selectedElements.length === 1 && elementLayer(page.id, selectedElements[0], -Infinity),
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
        console.log('state eq check...');
        return false;
      },
*/
    }
  ),
  withProps(isSelectedAnimation),
  withState('handlers', 'setHandlers', calculateHandlers),
  withProps(props => {
    const {
      aeroelastic,
      setAeroelastic,
      handlers,
      setHandlers,
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
        console.log(newScenePrep.primaryUpdate.payload.uid)
        setAeroelastic(nextScene(newScenePrep));
        if (0)
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
                // console.log('removing groups', elementsToRemove.map(e => e.id).join(', '));
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
                positions => setMultiplePositions(positions.map(p => ({ ...p, pageId: page.id }))),
                currentScene,
                elements
              );

              // handlers can only change if there's change to Redux (checked by proxy of putting it in
              // the if(currentScene.gestureEnd) {...}
              // todo consider somehow putting it in or around `connect`, to more directly tie it to Redux change
              setHandlers(() =>
                calculateHandlers({
                  aeroelastic,
                  page,
                  insertNodes,
                  removeElements,
                  selectElement,
                  elementLayer,
                })
              );
            }

            return {
              ...state,
              currentScene,
            };
          });
      },
      ...handlers,
    };
  }), // Updates states; needs to have both local and global
  withHandlers(eventHandlers) // Captures user intent, needs to have reconciled state
)(Component);

WorkpadPage.propTypes = {
  page: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
};
