/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { mapValues } from 'lodash';

// maps 'option' for mac and 'alt' for other OS
const getAltShortcuts = shortcuts => {
  if (!Array.isArray(shortcuts)) {
    shortcuts = [shortcuts];
  }
  const optionShortcuts = shortcuts.map(shortcut => `option+${shortcut}`);
  const altShortcuts = shortcuts.map(shortcut => `alt+${shortcut}`);

  return {
    osx: optionShortcuts,
    windows: altShortcuts,
    linux: altShortcuts,
    other: altShortcuts,
  };
};

// maps 'command' for mac and 'ctrl' for other OS
const getCtrlShortcuts = shortcuts => {
  if (!Array.isArray(shortcuts)) {
    shortcuts = [shortcuts];
  }
  const cmdShortcuts = shortcuts.map(shortcut => `command+${shortcut}`);
  const ctrlShortcuts = shortcuts.map(shortcut => `ctrl+${shortcut}`);

  return {
    osx: cmdShortcuts,
    windows: ctrlShortcuts,
    linux: ctrlShortcuts,
    other: ctrlShortcuts,
  };
};

const refreshShortcut = { ...getAltShortcuts('r'), help: 'Refresh workpad' };
const previousPageShortcut = { ...getAltShortcuts('['), help: 'Go to previous page' };
const nextPageShortcut = { ...getAltShortcuts(']'), help: 'Go to next page' };

export const keymap = {
  ELEMENT: {
    displayName: 'Element controls',
    COPY: { ...getCtrlShortcuts('c'), help: 'Copy elements' },
    CLONE: { ...getCtrlShortcuts('d'), help: 'Clone elements' },
    CUT: { ...getCtrlShortcuts('x'), help: 'Cut elements' },
    PASTE: { ...getCtrlShortcuts('v'), help: 'Paste' },
    DELETE: {
      osx: ['backspace'],
      windows: ['del', 'backspace'],
      linux: ['del', 'backspace'],
      other: ['del', 'backspace'],
      help: 'Delete elements',
    },
    BRING_FORWARD: {
      ...getCtrlShortcuts('up'),
      help: 'Send element forward one layer',
    },
    SEND_BACKWARD: {
      ...getCtrlShortcuts('down'),
      help: 'Send element back one layer',
    },
    BRING_TO_FRONT: {
      ...getCtrlShortcuts('shift+up'),
      help: 'Send element to front',
    },
    SEND_TO_BACK: {
      ...getCtrlShortcuts('shift+down'),
      help: 'Send element to back',
    },
    GROUP: {
      osx: ['g'],
      windows: ['g'],
      linux: ['g'],
      other: ['g'],
      help: 'Group elements',
    },
    UNGROUP: {
      osx: ['u'],
      windows: ['u'],
      linux: ['u'],
      other: ['u'],
      help: 'Ungroup elements',
    },
  },
  EDITOR: {
    displayName: 'Editor controls',
    UNDO: { ...getCtrlShortcuts('z'), help: 'Undo last action' },
    REDO: { ...getCtrlShortcuts('shift+z'), help: 'Redo last action' },
    PREV: previousPageShortcut,
    NEXT: nextPageShortcut,
    EDITING: { ...getAltShortcuts('e'), help: 'Toggle edit mode' },
    GRID: { ...getAltShortcuts('g'), help: 'Show grid' },
    REFRESH: refreshShortcut,
  },
  PRESENTATION: {
    displayName: 'Presentation mode',
    FULLSCREEN: { ...getAltShortcuts(['p', 'f']), help: 'Enter presentation mode' },
    FULLSCREEN_EXIT: {
      osx: ['esc'],
      windows: ['esc'],
      linux: ['esc'],
      other: ['esc'],
      help: 'Exit presentation mode',
    },
    PREV: mapValues(previousPageShortcut, (osShortcuts, key) =>
      key === 'help' ? osShortcuts : osShortcuts.concat(['backspace', 'left'])
    ),
    NEXT: mapValues(nextPageShortcut, (osShortcuts, key) =>
      key === 'help' ? osShortcuts : osShortcuts.concat(['space', 'right'])
    ),
    REFRESH: refreshShortcut,
  },
};
