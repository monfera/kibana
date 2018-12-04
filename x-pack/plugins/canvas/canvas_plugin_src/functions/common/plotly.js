/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export const plotly = () => ({
  name: 'plotly',
  aliases: [],
  type: 'plotly',
  //as: 'plotly',
  help: 'Create a plotly',
  context: {
    types: ['null'],
  },
  args: {
    plotly: {
      types: ['string', 'null'],
      help: 'Pick a plotly',
      aliases: ['_'],
      default: 'square',
      options: [
        'arrow',
        'arrowMulti',
        'bookmark',
        'cross',
        'circle',
        'hexagon',
        'kite',
        'pentagon',
        'rhombus',
        'semicircle',
        'speechBubble',
        'square',
        'star',
        'tag',
        'triangle',
        'triangleRight',
      ],
    },
    fill: {
      types: ['string', 'null'],
      help: 'Valid CSS color string',
      default: 'black',
    },
    title: {
      types: ['string', 'null'],
      help: 'Title of the chart',
      default: null,
    },
    border: {
      types: ['string', 'null'],
      aliases: ['stroke'],
      help: 'Valid CSS color string',
    },
    borderWidth: {
      types: ['number', 'null'],
      aliases: ['strokeWidth'],
      help: 'Thickness of the border',
      default: '0',
    },
    maintainAspect: {
      types: ['boolean'],
      help: 'Select true to maintain aspect ratio',
      default: false,
      options: [true, false],
    },
  },
  fn: (context, { plotly, fill, border, borderWidth, maintainAspect, title }) => ({
    type: 'plotly',
    plotly,
    fill,
    border,
    borderWidth,
    maintainAspect,
    title,
  }),
});
