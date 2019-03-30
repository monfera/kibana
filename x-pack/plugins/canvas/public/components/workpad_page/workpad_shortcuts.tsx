/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component } from 'react';

import isEqual from 'react-fast-compare';
// @ts-ignore
import { Shortcuts } from 'react-shortcuts';
// @ts-ignore
import { getClipboardData, setClipboardData } from '../../lib/clipboard';
// @ts-ignore
import { cloneSubgraphs } from '../../lib/clone_subgraphs';
// @ts-ignore
import { notify } from '../../lib/notify';

export interface Props {
  pageId: string;
  selectedNodes: any[];
  selectToplevelNodes: (...nodeIds: string[]) => void;
  insertNodes: (pageId: string) => (selectedNodes: any[]) => void;
  removeNodes: (pageId: string) => (selectedNodeIds: string[]) => void;
  elementLayer: (pageId: string, selectedNode: any, movement: any) => void;
  groupNodes: () => void;
  ungroupNodes: () => void;
}

const id = (node: any): string => node.id;

const deleteNodes = ({ pageId, removeNodes, selectedNodes }) => {
  // currently, handle the removal of one node, exploiting multiselect subsequently
  if (selectedNodes.length) {
    removeNodes(pageId)(selectedNodes.map(id));
  }
};

const copyNodes = ({ selectedNodes }) => {
  if (selectedNodes.length) {
    setClipboardData({ selectedNodes });
    notify.success('Copied element to clipboard');
  }
};

const cutNodes = ({ pageId, removeNodes, selectedNodes }) => {
  if (selectedNodes.length) {
    setClipboardData({ selectedNodes });
    removeNodes(pageId)(selectedNodes.map(id));
    notify.success('Cut element to clipboard');
  }
};

const duplicateNodes = ({ insertNodes, pageId, selectToplevelNodes, selectedNodes }) => {
  // TODO: This is slightly different from the duplicateNodes function in sidebar/index.js. Should they be doing the same thing?
  // This should also be abstracted.
  const clonedNodes = selectedNodes && cloneSubgraphs(selectedNodes);
  if (clonedNodes) {
    insertNodes(pageId)(clonedNodes);
    selectToplevelNodes(clonedNodes);
  }
};

const pasteNodes = ({ insertNodes, pageId, selectToplevelNodes }) => {
  const { selectedNodes } = JSON.parse(getClipboardData()) || { selectedNodes: [] };
  const clonedNodes = selectedNodes && cloneSubgraphs(selectedNodes);
  if (clonedNodes) {
    insertNodes(pageId)(clonedNodes); // first clone and persist the new node(s)
    selectToplevelNodes(clonedNodes); // then select the cloned node(s)
  }
};

const bringForward = ({ elementLayer, pageId, selectedNodes }) => {
  // TODO: Same as above. Abstract these out. This is the same code as in sidebar/index.js
  // Note: these layer actions only work when a single node is selected
  if (selectedNodes.length === 1) {
    elementLayer(pageId, selectedNodes[0], 1);
  }
};

const bringToFront = ({ elementLayer, pageId, selectedNodes }) => {
  if (selectedNodes.length === 1) {
    elementLayer(pageId, selectedNodes[0], Infinity);
  }
};

const sendBackward = ({ elementLayer, pageId, selectedNodes }) => {
  if (selectedNodes.length === 1) {
    elementLayer(pageId, selectedNodes[0], -1);
  }
};

const sendToBack = ({ elementLayer, pageId, selectedNodes }) => {
  if (selectedNodes.length === 1) {
    elementLayer(pageId, selectedNodes[0], -Infinity);
  }
};

const group = ({ groupNodes }) => groupNodes();

const ungroup = ({ ungroupNodes }) => ungroupNodes();

const keyMap = {
  COPY: copyNodes,
  CLONE: duplicateNodes,
  CUT: cutNodes,
  DELETE: deleteNodes,
  PASTE: pasteNodes,
  BRING_FORWARD: bringForward,
  BRING_TO_FRONT: bringToFront,
  SEND_BACKWARD: sendBackward,
  SEND_TO_BACK: sendToBack,
  GROUP: group,
  UNGROUP: ungroup,
};

export class WorkpadShortcuts extends Component<Props> {
  public render() {
    const { pageId } = this.props;
    return (
      <Shortcuts
        name="ELEMENT"
        handler={(action: string, event: Event) => {
          event.preventDefault();
          keyMap[action](this.props);
        }}
        targetNodeSelector={`#${pageId}`}
        global
      />
    );
  }

  public shouldComponentUpdate(nextProps: Props) {
    return !isEqual(nextProps, this.props);
  }
}
