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

export class WorkpadShortcuts extends Component<Props> {
  public render() {
    const { pageId } = this.props;
    return (
      <Shortcuts
        name="ELEMENT"
        handler={(action: string, event: Event) => {
          this._keyHandler(action, event);
        }}
        targetNodeSelector={`#${pageId}`}
        global
      />
    );
  }

  public shouldComponentUpdate(nextProps: Props) {
    return !isEqual(nextProps, this.props);
  }

  private _keyHandler(action: string, event: Event) {
    event.preventDefault();
    switch (action) {
      case 'COPY':
        this._copyNodes();
        break;
      case 'CLONE':
        this._duplicateNodes();
        break;
      case 'CUT':
        this._cutNodes();
        break;
      case 'DELETE':
        this._removeNodes();
        break;
      case 'PASTE':
        this._pasteNodes();
        break;
      case 'BRING_FORWARD':
        this._bringForward();
        break;
      case 'BRING_TO_FRONT':
        this._bringToFront();
        break;
      case 'SEND_BACKWARD':
        this._sendBackward();
        break;
      case 'SEND_TO_BACK':
        this._sendToBack();
        break;
      case 'GROUP':
        this.props.groupNodes();
        break;
      case 'UNGROUP':
        this.props.ungroupNodes();
        break;
    }
  }

  private _removeNodes() {
    const { pageId, removeNodes, selectedNodes } = this.props;
    // currently, handle the removal of one node, exploiting multiselect subsequently
    if (selectedNodes.length) {
      removeNodes(pageId)(selectedNodes.map(id));
    }
  }

  private _copyNodes() {
    const { selectedNodes } = this.props;
    if (selectedNodes.length) {
      setClipboardData({ selectedNodes });
      notify.success('Copied element to clipboard');
    }
  }

  private _cutNodes() {
    const { pageId, removeNodes, selectedNodes } = this.props;

    if (selectedNodes.length) {
      setClipboardData({ selectedNodes });
      removeNodes(pageId)(selectedNodes.map(id));
      notify.success('Copied element to clipboard');
    }
  }

  // TODO: This is slightly different from the duplicateNodes function in sidebar/index.js. Should they be doing the same thing?
  // This should also be abstracted.
  private _duplicateNodes() {
    const { insertNodes, pageId, selectToplevelNodes, selectedNodes } = this.props;

    const clonedNodes = selectedNodes && cloneSubgraphs(selectedNodes);

    if (clonedNodes) {
      insertNodes(pageId)(clonedNodes);
      selectToplevelNodes(clonedNodes);
    }
  }

  private _pasteNodes() {
    const { insertNodes, pageId, selectToplevelNodes } = this.props;
    const { selectedNodes } = JSON.parse(getClipboardData()) || { selectedNodes: [] };

    const clonedNodes = selectedNodes && cloneSubgraphs(selectedNodes);

    if (clonedNodes) {
      insertNodes(pageId)(clonedNodes); // first clone and persist the new node(s)
      selectToplevelNodes(clonedNodes); // then select the cloned node(s)
    }
  }

  // TODO: Same as above. Abstract these out. This is the same code as in sidebar/index.js
  // Note: these layer actions only work when a single node is selected
  private _bringForward() {
    const { elementLayer, pageId, selectedNodes } = this.props;
    if (selectedNodes.length === 1) {
      elementLayer(pageId, selectedNodes[0], 1);
    }
  }

  private _bringToFront() {
    const { elementLayer, pageId, selectedNodes } = this.props;
    if (selectedNodes.length === 1) {
      elementLayer(pageId, selectedNodes[0], Infinity);
    }
  }

  private _sendBackward() {
    const { elementLayer, pageId, selectedNodes } = this.props;
    if (selectedNodes.length === 1) {
      elementLayer(pageId, selectedNodes[0], -1);
    }
  }

  private _sendToBack() {
    const { elementLayer, pageId, selectedNodes } = this.props;
    if (selectedNodes.length === 1) {
      elementLayer(pageId, selectedNodes[0], -Infinity);
    }
  }
}
