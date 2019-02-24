/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { compose, withHandlers, withProps } from 'recompose';
import { getNodes } from '../../state/selectors/workpad';
import { commitAeroelastic } from './../../state/actions/canvas';
import { makeUid, reduxToAero } from './aeroelastic_redux_helpers';
import { eventHandlers } from './event_handlers';
import { WorkpadPage as Component } from './workpad_page';

const mapStateToProps = (state, ownProps) => {
  const elements = getNodes(state, ownProps.page.id);
  return {
    isEditable: true,
    elements,
    aeroelastic: state.transient.aeroelastic || reduxToAero(elements),
  };
};

export const WorkpadPage = compose(
  connect(
    mapStateToProps,
    null,
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
  withProps(props => {
    const { aeroelastic, handlers, elements, dispatch } = props;
    const { shapes, cursor } = aeroelastic;
    const elementLookup = new Map(elements.map(element => [element.id, element]));
    const shapesToRender = shapes.map(shape => {
      const pageElement = elementLookup.has(shape.id) && elementLookup.get(shape.id);
      return {
        ...(pageElement ? { ...shape, filter: pageElement.filter } : shape),
        width: shape.a * 2,
        height: shape.b * 2,
      };
    });
    return {
      className: 'canvasPage--isActive',
      elements: shapesToRender,
      cursor,
      commit: (type, payload) =>
        dispatch(commitAeroelastic({ type, payload: { ...payload, uid: makeUid() } })),
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
