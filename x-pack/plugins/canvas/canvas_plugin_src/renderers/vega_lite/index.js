/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// import * as vega from 'vega-lib'; // eslint-disable-line import/no-extraneous-dependencies
// import * as vegaLite from 'vega-lite'; // eslint-disable-line import/no-extraneous-dependencies
import Vega from 'react-vega'; // eslint-disable-line import/no-extraneous-dependencies
import React from 'react';

import * as ReactDOM from 'react-dom';

const spec =
  //JSON.parse(`{"$schema":"https://vega.github.io/schema/vega/v3.0.json","description":"A simple bar chart with embedded data.","autosize":"pad","padding":5,"style":"cell","data":[{"name":"source","values":[{"x":40,"y":"A"},{"x":20,"y":"B"},{"x":50,"y":"C"},{"x":5,"y":"D"}]},{"name":"selected","on":[{"trigger":"clicked","toggle":"clicked"}]}],"signals":[{"name":"width","update":"600"},{"name":"height","update":"400"},{"name":"clicked","value":null,"on":[{"events":"@marks:click","update":"{value: datum.y}","force":true}]}],"marks":[{"name":"marks","type":"rect","style":["bar"],"from":{"data":"source"},"encode":{"update":{"x":{"scale":"x","field":"x"},"x2":{"scale":"x","value":0},"y":{"scale":"y","field":"y"},"height":{"scale":"y","band":true},"fill":[{"test":"(!length(data('selected')) || indata('selected', 'value', datum.y))","scale":"color","field":"y"},{"value":"grey"}]}}}],"scales":[{"name":"x","type":"linear","domain":{"data":"source","field":"x"},"range":[0,{"signal":"width"}],"round":true,"nice":true,"zero":true},{"name":"y","type":"band","domain":{"data":"source","field":"y","sort":true},"range":[{"signal":"height"},0],"round":true,"paddingInner":0.1,"paddingOuter":0.05},{"name":"color","type":"ordinal","domain":{"data":"source","field":"y","sort":true},"range":"category"}],"axes":[{"scale":"x","labelOverlap":true,"orient":"bottom","tickCount":{"signal":"ceil(width/40)"},"title":"x in cursive font (see config)","zindex":1},{"scale":"x","domain":false,"grid":true,"labels":false,"maxExtent":0,"minExtent":0,"orient":"bottom","tickCount":{"signal":"ceil(width/40)"},"ticks":false,"zindex":0,"gridScale":"y"},{"scale":"y","labelOverlap":true,"orient":"left","title":"y in cursive font (see config)","zindex":1}],"config":{"axis":{"domainColor":"#888","tickColor":"#888","labelFont":"cursive","titleFont":"cursive"},"axisY":{"minExtent":30}}}`);
  {
    $schema: 'https://vega.github.io/schema/vega/v3.0.json',
    description: 'A simple bar chart with embedded data.',
    autosize: 'none',
    padding: { top: 0, left: 0, right: 0, bottom: 0 },
    style: 'cell',
    data: [{ name: 'selected', on: [{ trigger: 'clicked', toggle: 'clicked' }] }],
    signals: [
      {
        name: 'clicked',
        value: null,
        on: [{ events: '@marks:click', update: '{value: datum.y}', force: true }],
      },
    ],
    marks: [
      {
        name: 'marks',
        type: 'rect',
        style: ['bar'],
        from: { data: 'source' },
        encode: {
          update: {
            x: { scale: 'x', field: 'FlightDelayMin' },
            x2: { scale: 'x', value: 0 },
            y: { scale: 'y', field: 'Carrier' },
            height: { scale: 'y', band: true },
            fill: [
              {
                test: "(!length(data('selected')) || indata('selected', 'value', datum.y))",
                scale: 'color',
                field: 'Carrier',
              },
              { value: 'grey' },
            ],
          },
        },
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        domain: { data: 'source', field: 'FlightDelayMin' },
        range: [100, { signal: 'width - 50' }],
        round: true,
        nice: true,
        zero: true,
      },
      {
        name: 'y',
        type: 'band',
        domain: { data: 'source', field: 'Carrier', sort: false },
        range: [50, { signal: 'height - 50' }],
        round: true,
        paddingInner: 0.3,
        paddingOuter: 0.2,
      },
      {
        name: 'color',
        type: 'ordinal',
        domain: { data: 'source', field: 'Carrier', sort: false },
        range: 'category',
      },
    ],
    axes: [
      {
        scale: 'x',
        labelOverlap: true,
        orient: 'bottom',
        tickCount: { signal: 'ceil(width/50)' },
        title: 'FlightDelayMin',
        offset: -50,
        zindex: 1,
      },
      {
        scale: 'x',
        domain: false,
        grid: true,
        labels: false,
        maxExtent: 0,
        minExtent: 0,
        orient: 'bottom',
        tickCount: { signal: 'ceil(width/50)' },
        ticks: false,
        zindex: 0,
        gridScale: 'y',
      },
      {
        scale: 'y',
        labelOverlap: true,
        orient: 'left',
        title: 'Carrier',
        offset: -100,
        zindex: 1,
      },
    ],
    config: {
      axis: { domainColor: '#888', tickColor: '#888' },
      axisY: { minExtent: 30 },
      style: {
        cell: {
          stroke: 'transparent',
        },
      },
    },
  };

const spec2 = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: 500,
  height: 380,
  padding: 0,
  autosize: 'fit',

  config: {
    text: {
      font: 'Ideal Sans, Avenir Next, Helvetica',
    },
    title: {
      font: 'Ideal Sans, Avenir Next, Helvetica',
      fontWeight: 500,
      fontSize: 17,
      limit: -1,
    },
    axis: {
      labelFont: 'Ideal Sans, Avenir Next, Helvetica',
      labelFontSize: 12,
    },
  },

  signals: [
    { name: 'size', value: 2.3 },
    { name: 'domainMax', value: 5000 },
    { name: 'bandwidth', value: 0.0005 },
    {
      name: 'offsets',
      value: {
        bubbletea: -1,
        chinese: -1.5,
        japanese: -2,
        korean: -3,
        mideastern: -2,
        indian: -1,
        breakfast: -3.5,
        latin: 31,
      },
    },
    {
      name: 'categories',
      value: [
        'coffee',
        'drinks',
        'bubbletea',
        'vietnamese',
        'thai',
        'chinese',
        'japanese',
        'korean',
        'mideastern',
        'indian',
        'burgers',
        'pizza',
        'american',
        'breakfast',
        'bakeries',
        'seafood',
        'hawaiian',
        'veg',
        'latin',
      ],
    },
    {
      name: 'names',
      value: [
        'Coffee',
        'Pubs, Lounges',
        'Bubble Tea, Juice',
        'Vietnamese',
        'Thai',
        'Chinese',
        'Japanese',
        'Korean',
        'Middle Eastern',
        'Indian, Pakistani',
        'Pizza',
        'Burgers',
        'American',
        'Breakfast, Brunch',
        'Bakeries',
        'Seafood',
        'Hawaiian',
        'Vegetarian, Vegan',
        'Mexican, Latin American',
      ],
    },
    {
      name: 'colors',
      value: [
        '#7f7f7f',
        '#7f7f7f',
        '#7f7f7f',
        '#1f77b4',
        '#1f77b4',
        '#1f77b4',
        '#1f77b4',
        '#1f77b4',
        '#2ca02c',
        '#2ca02c',
        '#ff7f0e',
        '#ff7f0e',
        '#ff7f0e',
        '#8c564b',
        '#8c564b',
        '#e377c2',
        '#e377c2',
        '#bcbd22',
        '#17becf',
      ],
    },
  ],

  data: [
    {
      name: 'source',
      values: [
        { key: 'bakeries', lat: 47.66887 },
        { key: 'bakeries', lat: 47.6617813110352 },
        { key: 'bakeries', lat: 47.65998 },
        { key: 'bakeries', lat: 47.6633732020855 },
        { key: 'bakeries', lat: 47.6582099 },
        { key: 'bakeries', lat: 47.66105 },
        { key: 'indian', lat: 47.669083 },
        { key: 'indian', lat: 47.6647397425756 },
        { key: 'indian', lat: 47.65898 },
        { key: 'indian', lat: 47.6641 },
        { key: 'indian', lat: 47.6587699 },
        { key: 'indian', lat: 47.6623521 },
        { key: 'hawaiian', lat: 47.664349 },
        { key: 'hawaiian', lat: 47.6627388 },
        { key: 'hawaiian', lat: 47.66359 },
        { key: 'korean', lat: 47.658201 },
        { key: 'korean', lat: 47.664349 },
        { key: 'korean', lat: 47.65714 },
        { key: 'korean', lat: 47.66671 },
        { key: 'korean', lat: 47.65847 },
        { key: 'korean', lat: 47.667652 },
        { key: 'korean', lat: 47.66208 },
        { key: 'korean', lat: 47.6577399 },
        { key: 'korean', lat: 47.6571884155273 },
        { key: 'korean', lat: 47.6577399 },
        { key: 'burgers', lat: 47.6616432 },
        { key: 'burgers', lat: 47.659244 },
        { key: 'burgers', lat: 47.66464 },
        { key: 'burgers', lat: 47.6616201 },
        { key: 'burgers', lat: 47.66171 },
        { key: 'burgers', lat: 47.6582099 },
        { key: 'burgers', lat: 47.6614373897426 },
        { key: 'burgers', lat: 47.66476 },
        { key: 'burgers', lat: 47.655889079095 },
        { key: 'bubbletea', lat: 47.661484 },
        { key: 'bubbletea', lat: 47.664773 },
        { key: 'bubbletea', lat: 47.6638174140586 },
        { key: 'bubbletea', lat: 47.6628435 },
        { key: 'bubbletea', lat: 47.6608 },
        { key: 'bubbletea', lat: 47.65714 },
        { key: 'bubbletea', lat: 47.664073559291 },
        { key: 'bubbletea', lat: 47.66325 },
        { key: 'bubbletea', lat: 47.66105 },
        { key: 'bubbletea', lat: 47.661621 },
        { key: 'bubbletea', lat: 47.66325 },
        { key: 'bubbletea', lat: 47.6568748203069 },
        { key: 'seafood', lat: 47.66015 },
        { key: 'seafood', lat: 47.66464 },
        { key: 'seafood', lat: 47.6616432 },
        { key: 'veg', lat: 47.66838 },
        { key: 'veg', lat: 47.664773 },
        { key: 'veg', lat: 47.6675671 },
        { key: 'veg', lat: 47.6686016 },
        { key: 'vietnamese', lat: 47.65822 },
        { key: 'vietnamese', lat: 47.65919 },
        { key: 'vietnamese', lat: 47.6581344604492 },
        { key: 'vietnamese', lat: 47.6594222814143 },
        { key: 'vietnamese', lat: 47.6577 },
        { key: 'vietnamese', lat: 47.65547 },
        { key: 'vietnamese', lat: 47.6584999 },
        { key: 'vietnamese', lat: 47.65878 },
        { key: 'latin', lat: 47.6647592219734 },
        { key: 'latin', lat: 47.65714 },
        { key: 'latin', lat: 47.6659099 },
        { key: 'latin', lat: 47.65923 },
        { key: 'latin', lat: 47.65161 },
        { key: 'latin', lat: 47.6643199 },
        { key: 'latin', lat: 47.6595391 },
        { key: 'latin', lat: 47.6614673237322 },
        { key: 'japanese', lat: 47.66671 },
        { key: 'japanese', lat: 47.664349 },
        { key: 'japanese', lat: 47.6617467 },
        { key: 'japanese', lat: 47.6599989831448 },
        { key: 'japanese', lat: 47.6580970623725 },
        { key: 'japanese', lat: 47.6610565185547 },
        { key: 'japanese', lat: 47.657078 },
        { key: 'japanese', lat: 47.65964 },
        { key: 'japanese', lat: 47.6667608320713 },
        { key: 'japanese', lat: 47.65799 },
        { key: 'japanese', lat: 47.66359 },
        { key: 'japanese', lat: 47.6577399 },
        { key: 'japanese', lat: 47.6571884155273 },
        { key: 'japanese', lat: 47.65902 },
        { key: 'breakfast', lat: 47.6646650792784 },
        { key: 'breakfast', lat: 47.6597958 },
        { key: 'breakfast', lat: 47.657772 },
        { key: 'breakfast', lat: 47.66295 },
        { key: 'breakfast', lat: 47.65651 },
        { key: 'breakfast', lat: 47.65851 },
        { key: 'breakfast', lat: 47.6595172 },
        { key: 'breakfast', lat: 47.6565299 },
        { key: 'thai', lat: 47.66679 },
        { key: 'thai', lat: 47.6581344604492 },
        { key: 'thai', lat: 47.6675671 },
        { key: 'thai', lat: 47.662455 },
        { key: 'thai', lat: 47.6588020473719 },
        { key: 'thai', lat: 47.6642113 },
        { key: 'thai', lat: 47.65928 },
        { key: 'thai', lat: 47.6587699 },
        { key: 'thai', lat: 47.65547 },
        { key: 'american', lat: 47.6680599 },
        { key: 'american', lat: 47.657772 },
        { key: 'american', lat: 47.6616432 },
        { key: 'american', lat: 47.65651 },
        { key: 'american', lat: 47.6616201 },
        { key: 'american', lat: 47.6608123779297 },
        { key: 'chinese', lat: 47.6651010477427 },
        { key: 'chinese', lat: 47.66815 },
        { key: 'chinese', lat: 47.6581344604492 },
        { key: 'chinese', lat: 47.66144 },
        { key: 'chinese', lat: 47.66389 },
        { key: 'chinese', lat: 47.66236 },
        { key: 'chinese', lat: 47.65714 },
        { key: 'chinese', lat: 47.66105 },
        { key: 'chinese', lat: 47.6568856156391 },
        { key: 'chinese', lat: 47.662628 },
        { key: 'chinese', lat: 47.6594399 },
        { key: 'chinese', lat: 47.66174 },
        { key: 'chinese', lat: 47.6571884155273 },
        { key: 'chinese', lat: 47.6643 },
        { key: 'mideastern', lat: 47.66244 },
        { key: 'mideastern', lat: 47.66093 },
        { key: 'mideastern', lat: 47.65805 },
        { key: 'mideastern', lat: 47.65991 },
        { key: 'mideastern', lat: 47.6590045 },
        { key: 'mideastern', lat: 47.6647397425756 },
        { key: 'mideastern', lat: 47.6691895 },
        { key: 'mideastern', lat: 47.6587699 },
        { key: 'mideastern', lat: 47.6623521 },
        { key: 'mideastern', lat: 47.66295 },
        { key: 'mideastern', lat: 47.65867 },
        { key: 'mideastern', lat: 47.6679654176159 },
        { key: 'pizza', lat: 47.65847 },
        { key: 'pizza', lat: 47.662201 },
        { key: 'pizza', lat: 47.6686016 },
        { key: 'pizza', lat: 47.66671 },
        { key: 'pizza', lat: 47.65784 },
        { key: 'pizza', lat: 47.66729 },
        { key: 'pizza', lat: 47.667652 },
        { key: 'pizza', lat: 47.658947 },
        { key: 'pizza', lat: 47.6558651 },
        { key: 'drinks', lat: 47.6680599 },
        { key: 'drinks', lat: 47.6617813110352 },
        { key: 'drinks', lat: 47.66479 },
        { key: 'drinks', lat: 47.65553 },
        { key: 'drinks', lat: 47.65784 },
        { key: 'drinks', lat: 47.65735 },
        { key: 'drinks', lat: 47.6614427887238 },
        { key: 'drinks', lat: 47.6614373897426 },
        { key: 'drinks', lat: 47.6608123779297 },
        { key: 'drinks', lat: 47.658947 },
        { key: 'drinks', lat: 47.66171 },
        { key: 'drinks', lat: 47.667652 },
        { key: 'coffee', lat: 47.6597958 },
        { key: 'coffee', lat: 47.6620911 },
        { key: 'coffee', lat: 47.6698722839355 },
        { key: 'coffee', lat: 47.6646650792784 },
        { key: 'coffee', lat: 47.6617813110352 },
        { key: 'coffee', lat: 47.657406 },
        { key: 'coffee', lat: 47.6587736 },
        { key: 'coffee', lat: 47.6638174140586 },
        { key: 'coffee', lat: 47.66148 },
        { key: 'coffee', lat: 47.66114 },
        { key: 'coffee', lat: 47.661484 },
        { key: 'coffee', lat: 47.66325 },
        { key: 'coffee', lat: 47.658561989665 },
        { key: 'coffee', lat: 47.664073559291 },
        { key: 'coffee', lat: 47.65998 },
        { key: 'coffee', lat: 47.6633732020855 },
        { key: 'coffee', lat: 47.6610565185547 },
        { key: 'coffee', lat: 47.66003 },
        { key: 'coffee', lat: 47.65851 },
        { key: 'coffee', lat: 47.6628435 },
        { key: 'coffee', lat: 47.6533553 },
        { key: 'coffee', lat: 47.6553802192211 },
        { key: 'coffee', lat: 47.6595772057772 },
        { key: 'coffee', lat: 47.65818 },
        { key: 'coffee', lat: 47.6546670937183 },
        { key: 'coffee', lat: 47.661621 },
        { key: 'coffee', lat: 47.66279 },
        { key: 'coffee', lat: 47.6563760338137 },
        { key: 'coffee', lat: 47.6568332490467 },
      ],
    },
    {
      name: 'annotation',
      values: [
        { name: 'Boat St.', align: 'left', lat: 47.6516 },
        { name: '40th St.', align: 'center', lat: 47.655363 },
        { name: '42nd St.', align: 'center', lat: 47.6584 },
        { name: '45th St.', align: 'center', lat: 47.6614 },
        { name: '50th St.', align: 'center', lat: 47.664924 },
        { name: '55th St.', align: 'center', lat: 47.668519 },
      ],
    },
  ],

  title: {
    text: 'A Mile-Long Global Food Market: Mapping Cuisine from “The Ave”',
    orient: 'top',
    anchor: 'start',
    frame: 'group',
    encode: {
      update: {
        dx: { value: -1 },
      },
    },
  },

  scales: [
    {
      name: 'xscale',
      type: 'linear',
      range: 'width',
      zero: false,
      domain: { data: 'source', field: 'lat' },
    },
    {
      name: 'yscale',
      type: 'band',
      range: 'height',
      round: true,
      padding: 0,
      domain: { signal: 'categories' },
    },
    {
      name: 'color',
      type: 'ordinal',
      range: { signal: 'colors' },
      domain: { signal: 'categories' },
    },
    {
      name: 'names',
      type: 'ordinal',
      domain: { signal: 'categories' },
      range: { signal: 'names' },
    },
  ],

  axes: [
    {
      orient: 'right',
      scale: 'yscale',
      domain: false,
      ticks: false,
      encode: {
        labels: {
          update: {
            dx: { value: 2 },
            dy: { value: 2 },
            y: { scale: 'yscale', field: 'value', band: 1 },
            text: { scale: 'names', field: 'value' },
            baseline: { value: 'bottom' },
          },
        },
      },
    },
  ],

  marks: [
    {
      type: 'rule',
      from: { data: 'annotation' },
      encode: {
        update: {
          x: { signal: "round(scale('xscale', datum.lat)) + 0.5" },
          y: { value: 20 },
          x2: { signal: "round(scale('xscale', datum.lat)) + 0.5" },
          y2: { signal: 'height', offset: 6 },
          stroke: { value: '#ddd' },
          strokeDash: { value: [3, 2] },
        },
      },
    },
    {
      type: 'text',
      from: { data: 'annotation' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'lat', offset: 0 },
          dx: { signal: "datum.align === 'left' ? -1 : 0" },
          y: { signal: 'height', offset: 6 },
          align: { field: 'align' },
          baseline: { value: 'top' },
          text: { field: 'name' },
          fontStyle: { value: 'italic' },
        },
      },
    },
    {
      type: 'group',
      from: {
        facet: {
          data: 'source',
          name: 'category',
          groupby: 'key',
          aggregate: {
            ops: ['min', 'max', 'count'],
            fields: ['lat', 'lat', 'lat'],
            as: ['min_lat', 'max_lat', 'count'],
          },
        },
      },
      encode: {
        update: {
          y: { scale: 'yscale', field: 'key' },
          width: { signal: 'width' },
          height: { scale: 'yscale', band: 1 },
        },
      },
      sort: {
        field: 'y',
        order: 'ascending',
      },
      signals: [{ name: 'height', update: "bandwidth('yscale')" }],
      data: [
        {
          name: 'density',
          source: 'category',
          transform: [
            {
              type: 'density',
              steps: 200,
              extent: { signal: "domain('xscale')" },
              distribution: {
                function: 'kde',
                field: 'lat',
                bandwidth: { signal: 'bandwidth' },
              },
            },
          ],
        },
      ],
      scales: [
        {
          name: 'yinner',
          type: 'linear',
          range: [{ signal: 'height' }, { signal: '0 - size * height' }],
          domain: [0, { signal: 'domainMax' }],
        },
      ],
      marks: [
        {
          type: 'area',
          from: { data: 'density' },
          encode: {
            enter: {
              fill: { scale: 'color', field: { parent: 'key' } },
              fillOpacity: { value: 0.7 },
              stroke: { value: 'white' },
              strokeWidth: { value: 1 },
            },
            update: {
              x: { scale: 'xscale', field: 'value' },
              y: { scale: 'yinner', signal: 'parent.count * datum.density' },
              y2: { scale: 'yinner', value: 0 },
            },
          },
        },
        {
          type: 'rule',
          clip: true,
          encode: {
            update: {
              y: { signal: 'height', offset: -0.5 },
              x: {
                scale: 'xscale',
                field: { parent: 'min_lat' },
                offset: {
                  signal:
                    "scale('xscale', 0) - scale('xscale', 2*bandwidth) + (offsets[parent.key] || 1) - 3",
                },
              },
              x2: { signal: 'width' },
              stroke: { value: '#aaa' },
              strokeWidth: { value: 0.25 },
              strokeOpacity: { value: 1 },
            },
          },
        },
        {
          type: 'symbol',
          from: { data: 'category' },
          encode: {
            enter: {
              fillOpacity: { value: 0 },
              size: { value: 50 },
              tooltip: { field: 'name' },
            },
            update: {
              x: { scale: 'xscale', field: 'lat' },
              y: { scale: 'yscale', band: 0.5 },
              fill: { scale: 'color', field: 'key' },
            },
          },
        },
      ],
    },
  ],
};
const Chart = ({ width, height, spec, data }) => {
  const sizedSpec = {
    ...spec,
    width: width * 2,
    height: height * 2,
/*
    viewport: [width, height],
    data: [
      {
        name: 'source',
        values: data.rows,
        transform: [
          {
            type: 'aggregate',
            fields: ['FlightDelayMin'],
            as: ['FlightDelayMin'],
            ops: ['mean'],
            groupby: ['Carrier'],
          },
        ],
      },
      ...spec.data,
    ],
    signals: [
      { name: 'width', update: width + '' },
      { name: 'height', update: height + '' },
      ...spec.signals,
    ],
*/
  };
  console.log(sizedSpec.width, sizedSpec.height)
  return (
    <div className="Chart" style={{ width, height }}>
      <Vega spec={sizedSpec} width={width} height={height} />
    </div>
  );
};

const App = ({ width, height, spec, data }) => {
  return (
    <div className="App">
      <Chart width={width} height={height} spec={spec} data={data} />
    </div>
  );
};

const draw = (domNode, spec, datatable) => {
  const width = domNode.offsetWidth;
  const height = domNode.offsetHeight;
  ReactDOM.render(<App width={width} height={height} spec={spec} data={datatable} />, domNode);
};

const render = (domNode, { datatable }, handlers) => {
  const vegaSpec = spec2;
  handlers.onDestroy(() => {});
  handlers.onResize(() => draw(domNode, vegaSpec, datatable));

  draw(domNode, vegaSpec, datatable);

  return handlers.done();
};

export const vegaLitePlot = () => ({
  name: 'vegalite',
  displayName: 'Vega Lite plot',
  help: 'Render any Vega Lite plot',
  render,
});

/*
filters
| essql "select Carrier,FlightDelayMin from kibana_sample_data_flights"
| render as="vegalite"
 */
