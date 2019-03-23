/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { PureComponent } from 'react';
import { ElementWrapper } from '../element_wrapper';
import { staticWorkpadPagePropTypes } from './prop_types';

export class StaticWorkpadPage extends PureComponent {
  static propTypes = staticWorkpadPagePropTypes;

  render() {
    const { page, className, animationStyle, elements, height, width } = this.props;

    return (
      <div
        key={page.id}
        id={page.id}
        data-test-subj="canvasWorkpadPage"
        className={`canvasPage ${className}`}
        data-shared-items-container
        style={{ ...page.style, ...animationStyle, height, width }}
      >
        {elements.map(element => (
          <ElementWrapper key={element.id} element={element} />
        ))}
      </div>
    );
  }
}
