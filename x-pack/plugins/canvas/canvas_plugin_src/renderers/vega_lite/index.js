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

const spec = JSON.parse(
  `{"$schema":"https://vega.github.io/schema/vega/v3.0.json","description":"A simple bar chart with embedded data.","autosize":"pad","padding":5,"style":"cell","data":[{"name":"source","values":[{"x":40,"y":"A"},{"x":20,"y":"B"},{"x":50,"y":"C"},{"x":5,"y":"D"}]},{"name":"selected","on":[{"trigger":"clicked","toggle":"clicked"}]}],"signals":[{"name":"width","update":"600"},{"name":"height","update":"400"},{"name":"clicked","value":null,"on":[{"events":"@marks:click","update":"{value: datum.y}","force":true}]}],"marks":[{"name":"marks","type":"rect","style":["bar"],"from":{"data":"source"},"encode":{"update":{"x":{"scale":"x","field":"x"},"x2":{"scale":"x","value":0},"y":{"scale":"y","field":"y"},"height":{"scale":"y","band":true},"fill":[{"test":"(!length(data('selected')) || indata('selected', 'value', datum.y))","scale":"color","field":"y"},{"value":"grey"}]}}}],"scales":[{"name":"x","type":"linear","domain":{"data":"source","field":"x"},"range":[0,{"signal":"width"}],"round":true,"nice":true,"zero":true},{"name":"y","type":"band","domain":{"data":"source","field":"y","sort":true},"range":[{"signal":"height"},0],"round":true,"paddingInner":0.1,"paddingOuter":0.05},{"name":"color","type":"ordinal","domain":{"data":"source","field":"y","sort":true},"range":"category"}],"axes":[{"scale":"x","labelOverlap":true,"orient":"bottom","tickCount":{"signal":"ceil(width/40)"},"title":"x in cursive font (see config)","zindex":1},{"scale":"x","domain":false,"grid":true,"labels":false,"maxExtent":0,"minExtent":0,"orient":"bottom","tickCount":{"signal":"ceil(width/40)"},"ticks":false,"zindex":0,"gridScale":"y"},{"scale":"y","labelOverlap":true,"orient":"left","title":"y in cursive font (see config)","zindex":1}],"config":{"axis":{"domainColor":"#888","tickColor":"#888","labelFont":"cursive","titleFont":"cursive"},"axisY":{"minExtent":30}}}`
);

const Chart = () => {
  return (
    <div className="Chart" style={{ width: 800, height: 400 }}>
      <Vega spec={spec} width={800} />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Chart />
    </div>
  );
}

/*
const draw = domNode => {
  const width = domNode.offsetWidth;
  const height = domNode.offsetHeight;
}
*/

const render = (domNode, config, handlers) => {
  handlers.onDestroy(() => {});
  handlers.onResize(() => {});

  ReactDOM.render(<App />, domNode);

  return handlers.done();
};

export const vegaLitePlot = () => ({
  name: 'vegalite',
  displayName: 'Vega Lite plot',
  help: 'Render any Vega Lite plot',
  render,
});
