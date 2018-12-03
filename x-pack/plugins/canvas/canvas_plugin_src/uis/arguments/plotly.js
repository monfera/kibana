/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { templateFromReactComponent } from '../../../public/lib/template_from_react_component';
import { PlotlyPickerMini } from '../../../public/components/plotly_picker_mini/';

const PlotlyArgInput = ({ onValueChange, argValue, typeInstance }) => (
  <EuiFlexGroup gutterSize="s">
    <EuiFlexItem grow={false}>
      <PlotlyPickerMini
        value={argValue}
        onChange={onValueChange}
        plotlys={typeInstance.options.plotlys}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

PlotlyArgInput.propTypes = {
  argValue: PropTypes.any.isRequired,
  onValueChange: PropTypes.func.isRequired,
  typeInstance: PropTypes.shape({
    options: PropTypes.shape({ plotlys: PropTypes.object.isRequired }).isRequired,
  }).isRequired,
};

export const plotly = () => ({
  name: 'plotly',
  displayName: 'Plotly',
  help: 'Plotly picker',
  simpleTemplate: templateFromReactComponent(PlotlyArgInput),
  default: '"square"',
});
