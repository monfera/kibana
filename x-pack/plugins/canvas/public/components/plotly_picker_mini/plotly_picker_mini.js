/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiLink } from '@elastic/eui';
import { Popover } from '../popover';
import { PlotlyPicker } from '../plotly_picker/';
import { PlotlyPreview } from '../plotly_preview';

export const PlotlyPickerMini = ({ plotlys, onChange, value, anchorPosition }) => {
  const button = handleClick => (
    <EuiLink style={{ fontSize: 0 }} onClick={handleClick}>
      <PlotlyPreview plotly={plotlys[value]} />
    </EuiLink>
  );

  return (
    <Popover
      panelClassName="canvas canvasPlotlyPickerMini--popover"
      button={button}
      anchorPosition={anchorPosition}
    >
      {() => <PlotlyPicker onChange={onChange} plotlys={plotlys} />}
    </Popover>
  );
};

PlotlyPickerMini.propTypes = {
  plotlys: PropTypes.object.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  anchorPosition: PropTypes.string,
};
