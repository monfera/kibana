/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { PureComponent } from 'react';
import { ElementWrapper } from '../element_wrapper';
import { AlignmentGuide } from '../alignment_guide';
import { HoverAnnotation } from '../hover_annotation';
import { TooltipAnnotation } from '../tooltip_annotation';
import { RotationHandle } from '../rotation_handle';
import { BorderConnection } from '../border_connection';
import { BorderResizeHandle } from '../border_resize_handle';
import { WorkpadShortcuts } from './workpad_shortcuts';
import { interactiveWorkpadPagePropTypes } from './prop_types';

export class InteractiveWorkpadPage extends PureComponent {
  static propTypes = interactiveWorkpadPagePropTypes;

  componentWillUnmount() {
    this.props.resetHandler();
  }

  render() {
    const {
      page,
      className,
      animationStyle,
      elements,
      cursor = 'auto',
      height,
      width,
      onDoubleClick,
      onKeyDown,
      onMouseDown,
      onMouseLeave,
      onMouseMove,
      onMouseUp,
      onAnimationEnd,
      onWheel,
      selectedElementIds,
      selectedElements,
      selectedPrimaryShapes,
      selectElement,
      insertNodes,
      removeElements,
      elementLayer,
      groupElements,
      ungroupElements,
      canvasOrigin,
      saveCanvasOrigin,
    } = this.props;

    let shortcuts = null;

    const shortcutProps = {
      elementLayer,
      groupElements,
      insertNodes,
      pageId: page.id,
      removeElements,
      selectedElementIds,
      selectedElements,
      selectedPrimaryShapes,
      selectElement,
      ungroupElements,
    };
    shortcuts = <WorkpadShortcuts {...shortcutProps} />;

    return (
      <div
        key={page.id}
        id={page.id}
        ref={element => {
          if (!canvasOrigin && element && element.getBoundingClientRect) {
            saveCanvasOrigin(() => () => element.getBoundingClientRect());
          }
        }}
        data-test-subj="canvasWorkpadPage"
        className={`canvasPage ${className} canvasPage--isEditable`}
        data-shared-items-container
        style={{ ...page.style, ...animationStyle, height, width, cursor }}
        onKeyDown={onKeyDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onDoubleClick}
        onAnimationEnd={onAnimationEnd}
        onWheel={onWheel}
      >
        {shortcuts}
        {elements
          .map(element => {
            if (element.type === 'annotation') {
              const props = {
                key: element.id,
                type: element.type,
                transformMatrix: element.transformMatrix,
                width: element.width,
                height: element.height,
                text: element.text,
              };

              switch (element.subtype) {
                case 'alignmentGuide':
                  return <AlignmentGuide {...props} />;
                case 'adHocChildAnnotation': // now sharing aesthetics but may diverge in the future
                case 'hoverAnnotation': // fixme: with the upcoming TS work, use enumerative types here
                  return <HoverAnnotation {...props} />;
                case 'rotationHandle':
                  return <RotationHandle {...props} />;
                case 'resizeHandle':
                  return <BorderResizeHandle {...props} />;
                case 'resizeConnector':
                  return <BorderConnection {...props} />;
                case 'rotationTooltip':
                  return <TooltipAnnotation {...props} />;
                default:
                  return [];
              }
            } else if (element.type !== 'group') {
              return <ElementWrapper key={element.id} element={element} />;
            }
          })
          .filter(element => !!element)}
      </div>
    );
  }
}
