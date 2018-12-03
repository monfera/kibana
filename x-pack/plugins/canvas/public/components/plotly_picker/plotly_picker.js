/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGrid, EuiFlexItem, EuiLink } from '@elastic/eui';
import { PlotlyPreview } from '../plotly_preview';

export const PlotlyPicker = ({ plotlys, onChange }) => {
  return (
    <EuiFlexGrid gutterSize="s" columns={4}>
      {Object.keys(plotlys)
        .sort()
        .map(shapeKey => (
          <EuiFlexItem key={shapeKey}>
            <EuiLink onClick={() => onChange(shapeKey)}>
              <PlotlyPreview shape={plotlys[shapeKey]} />
            </EuiLink>
          </EuiFlexItem>
        ))}
    </EuiFlexGrid>
  );
};

PlotlyPicker.propTypes = {
  plotlys: PropTypes.object.isRequired,
  onChange: PropTypes.func,
};
