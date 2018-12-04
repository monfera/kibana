/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Plotly from 'plotly.js-dist';

export const plotly = () => ({
  name: 'plotly',
  displayName: 'Plotly',
  help: 'Render a plotly plot',
  reuseDomNode: true,
  render(domNode, config, handlers) {
    const layout = { title: config.title };

    const trace1 = {
      x: [1, 2, 3, 4],
      y: [10, 15, 13, 17],
      mode: 'markers',
      type: 'scatter',
    };

    const trace2 = {
      x: [2, 3, 4, 5],
      y: [16, 5, 11, 9],
      mode: 'lines',
      type: 'scatter',
    };

    const trace3 = {
      x: [1, 2, 3, 4],
      y: [12, 9, 15, 12],
      mode: 'lines+markers',
      type: 'scatter',
    };

    const data = [trace1, trace2, trace3];

    Plotly.newPlot(domNode, data, layout, { responsive: false });

    const draw = () => {
      const width = domNode.offsetWidth;
      const height = domNode.offsetHeight;

      const trace2 = {
        x: [2, 3, 4, 5],
        y: [16, 5, 11, 9],
        mode: 'lines',
        type: 'scatter',
      };

      const trace3 = {
        x: [1, 2, 3, 4],
        y: [12, 9, 15, 12],
        mode: 'lines+markers',
        type: 'scatter',
      };

      const data = [trace1, trace2, trace3];

      Plotly.react(domNode, data, { ...layout, width, height, autosize: false }, {});
    };

    draw();
    handlers.done();
    handlers.onResize(draw); // debouncing avoided for fluidity
  },
});
