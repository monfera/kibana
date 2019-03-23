/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ElementWrapper } from '../element_wrapper';

// NOTE: the data-shared-* attributes here are used for reporting
export class StaticWorkpadPage extends PureComponent {
  static propTypes = {
    page: PropTypes.shape({
      id: PropTypes.string.isRequired,
      style: PropTypes.object,
    }).isRequired,
    className: PropTypes.string.isRequired,
    animationStyle: PropTypes.object.isRequired,
    elements: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        transformMatrix: PropTypes.arrayOf(PropTypes.number).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        type: PropTypes.string,
      })
    ).isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    onAnimationEnd: PropTypes.func,
  };

  render() {
    const { page, className, animationStyle, elements, height, width } = this.props;

    return (
      <div
        key={page.id}
        id={page.id}
        data-test-subj="canvasWorkpadPage"
        className={`canvasPage ${className}`}
        data-shared-items-container
        style={{
          ...page.style,
          ...animationStyle,
          height,
          width,
        }}
      >
        {elements
          .map(element => {
            if (element.type !== 'annotation' && element.type !== 'group') {
              return <ElementWrapper key={element.id} element={element} />;
            }
          })
          .filter(element => !!element)}
      </div>
    );
  }
}
