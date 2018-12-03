/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { axisConfig } from './axis_config';
import { datacolumn } from './datacolumn';
import { imageUpload } from './image_upload';
import { number } from './number';
import { palette } from './palette';
import { percentage } from './percentage';
import { plotly } from './plotly';
import { range } from './range';
import { select } from './select';
import { shape } from './shape';
import { string } from './string';
import { textarea } from './textarea';
import { toggle } from './toggle';

export const args = [
  axisConfig,
  datacolumn,
  imageUpload,
  number,
  palette,
  percentage,
  plotly,
  range,
  select,
  shape,
  string,
  textarea,
  toggle,
];
