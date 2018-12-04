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

    const colorMap = {};
    config.context.rows.forEach(r => {
      colorMap[r.color] = true;
    });
    const traces = Object.keys(colorMap).sort();

    const data = traces.map(colorDriver => {
      const points = config.context.rows
        .filter(r => r.color === colorDriver)
        .sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0));
      return {
        x: points.map(r => r.x),
        y: points.map(r => r.y),
        mode: 'lines+markers',
        type: 'scatter',
        name: colorDriver,
        //line: { color },
        //marker: { color },
      };
    });

    Plotly.newPlot(domNode, data, layout, { responsive: false });

    const draw = () => {
      const width = domNode.offsetWidth;
      const height = domNode.offsetHeight;

      Plotly.react(domNode, data, { ...layout, width, height, autosize: false }, {});
    };

    draw();
    handlers.done();
    handlers.onResize(draw); // debouncing avoided for fluidity
  },
});
