/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import header from './header.png';

export const plotly = () => ({
  name: 'plotly',
  displayName: 'Plotly',
  help: 'A plotly plot',
  width: 400,
  height: 250,
  image: header,
  expression: `filters
| demodata
| pointseries x="project" y="sum(price)" color="state" size="size(username)"
| plotly "scatter" title="Price in function of project"
| render
`,
});
