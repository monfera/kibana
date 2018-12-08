/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Plotly from 'plotly.js-dist';

const ascending = (a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0); // eslint-disable-line no-nested-ternary

const pointSeriesRender = (domNode, config, handlers) => {
  const layout = {
    title: config.title,
    xaxis: { title: config.context.columns.x.expression },
    yaxis: { title: config.context.columns.y.expression },
    zaxis: { title: config.context.columns.z && config.context.columns.z.expression },
  };

  const type = config.plotly || 'scatter';

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
      ...(config.context.columns.z && {
        z: points.map(r => r.z),
        marker: { size: 4 },
        line: { width: 0.25 },
      }),
      //mode: 'lines+markers',
      type,
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
};

const dataTableRender = (domNode, config, handlers) => {
  const firstNumeric = config.context.columns.find(c => c.type === 'number');
  const layout = {
    title: config.title,
  };

  const type = config.plotly || 'parcoords';

  const distinct = a => a.filter((d, i) => a.indexOf(d) === i);
  const toNumbers = cardinalValues => {
    const distinctValues = distinct(cardinalValues);
    const sorted = distinctValues.sort(ascending);
    const map = {};
    sorted.forEach((v, i) => (map[v] = i));
    const values = cardinalValues.map(v => map[v]);
    const tickvals = sorted.map((d, i) => i);
    const ticktext = sorted;
    return { values, tickvals, ticktext };
  };

  const countField = config.context.columns.find(f => f.name === 'count');
  const colorField = config.context.columns.find(f => f.name === 'color');

  const makeData = () => {
    switch (type) {
      case 'parcoords':
        return {
          type,
          line: {
            showscale: true,
            reversescale: true,
            colorscale: 'Viridis',
            color: config.context.rows.map(r => r[firstNumeric.name]),
          },
          tickfont: { size: 14 },
          dimensions: config.context.columns.map(d => {
            if (d.type === 'number') {
              return {
                label: d.name,
                values: config.context.rows.map(r => r[d.name]),
              };
            } else {
              const { values, tickvals, ticktext } = toNumbers(
                config.context.rows.map(r => r[d.name])
              );
              return {
                label: d.name,
                values,
                tickvals,
                ticktext,
              };
            }
          }),
        };
      case 'parcats':
        return {
          type,
          line: {
            ...(colorField && {
              color: toNumbers(config.context.rows.map(r => r.color)).values,
              //colorscale: [[0, 'lightsteelblue'], [distinct(toNumbers(config.context.rows.map(r => r['color'])).values).length - 1, 'mediumseagreen']],
              //colorscale: 'Viridis' || 'Pastel2',
              colorscale: Plotly.d3.scale
                .category20()
                .range()
                .map((c, i) => [i / 19, c]),
            }),
          },
          ...(countField && {
            counts: config.context.rows.map(r => r.count),
          }),
          tickfont: { size: 14 },
          dimensions: config.context.columns
            .map(d => {
              if (d.type === 'number' || type !== 'parcoords') {
                return {
                  label: d.name,
                  values: config.context.rows.map(r => r[d.name]),
                };
              } else {
                const { values, tickvals, ticktext } = toNumbers(
                  config.context.rows.map(r => r[d.name])
                );
                return {
                  label: d.name,
                  values,
                  tickvals,
                  ticktext,
                };
              }
            })
            .filter(dim => dim.label !== 'count' && dim.label !== 'color'),
        };
      case 'sankey':
        let nodeIndex = 0;
        const nodes = {};
        const links = [];
        for (let i = 0; i < config.context.rows.length; i++) {
          const row = config.context.rows[i];
          const propNames = Object.keys(row);
          let prev = null;
          for (let j = 0; j < propNames.length; j++) {
            const propName = propNames[j];
            if (['count', 'color'].indexOf(propName) >= 0) continue;
            const value = row[propName];
            const nodeKey = value + '_' + propName;
            const currentNodeIndex = nodes[nodeKey] || (nodes[nodeKey] = nodeIndex++);
            if (j > 0) {
              links.push([
                prev,
                currentNodeIndex,
                countField ? row.count : 1 /* count 1 by default */,
                Object.entries(row)
                  .map(([k, v]) => `${String(k).slice(0)}: ${String(v).slice(0)}`)
                  .join('<br>') + '<br>',
              ]);
            }
            prev = currentNodeIndex;
          }
        }
        return {
          type,
          orientation: 'h',
          node: {
            pad: 15,
            thickness: 30,
            line: {
              color: 'black',
              width: 0.5,
            },
            label: Object.entries(nodes)
              .sort((a, b) => a[1] - b[1])
              .map(([k]) => k),
            //color: ['blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
          },

          link: {
            source: links.map(l => l[0]),
            target: links.map(l => l[1]),
            value: links.map(l => l[2]),
            label: links.map(l => l[3]),
          },
          tickfont: { size: 14 },
        };
    }
  };

  const data = [makeData()];

  Plotly.newPlot(domNode, data, layout, { responsive: false });

  const draw = () => {
    const width = domNode.offsetWidth;
    const height = domNode.offsetHeight;

    Plotly.react(domNode, data, { ...layout, width, height, autosize: false }, {});
  };

  draw();
  handlers.done();
  handlers.onResize(draw); // debouncing avoided for fluidity
};

export const plotly = () => ({
  name: 'plotly',
  displayName: 'Plotly',
  help: 'Render a plotly plot',
  reuseDomNode: true,
  render(domNode, config, handlers) {
    if (config.context.type === 'pointseries') return pointSeriesRender(domNode, config, handlers);
    else if (config.context.type === 'datatable') return dataTableRender(domNode, config, handlers);
  },
});
