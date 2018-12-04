/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Plotly from 'plotly.js-dist';

const ascending = (a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0); // eslint-disable-line no-nested-ternary

export const plotly = () => ({
  name: 'plotly',
  displayName: 'Plotly',
  help: 'Render a plotly plot',
  reuseDomNode: true,
  render(domNode, config, handlers) {
    const layout = {
      title: config.title,
      xaxis: { title: config.context.columns.x.expression },
      yaxis: { title: config.context.columns.y.expression },
    };

    const colorMap = {};
    config.context.rows.forEach(r => {
      colorMap[r.color] = true;
    });
    const traces = Object.keys(colorMap).sort();

    const data = traces.map(colorDriver => {
      const points = config.context.rows.filter(r => r.color === colorDriver).sort(ascending);
      return {
        x: points.map(r => r.x),
        y: points.map(r => r.y),
        mode: 'lines+markers',
        type: 'scatter',
        name: colorDriver,
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
