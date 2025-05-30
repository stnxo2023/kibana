/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC } from 'react';
import PropTypes from 'prop-types';
import chroma from 'chroma-js';

import { ColorManager, Props as ColorManagerProps } from '../color_manager';
import { ColorPalette } from '../color_palette';

export interface Props extends ColorManagerProps {
  /**
   * An array of hexadecimal color values. Non-hex will be ignored.
   * @default []
   */
  colors?: string[];
}

export const ColorPicker: FC<Props> = ({
  colors = [],
  hasButtons = false,
  onAddColor,
  onChange,
  onRemoveColor,
  value = '',
}) => {
  const isValidColor = chroma.valid(value);

  colors = colors.filter((color) => {
    return chroma.valid(color);
  });

  let canRemove = false;
  let canAdd = false;

  if (isValidColor) {
    const match = colors.filter((color) => chroma(value).hex() === chroma(color).hex());
    canRemove = match.length > 0;
    canAdd = match.length === 0;
  }

  return (
    <div>
      <ColorPalette onChange={onChange} value={value} colors={colors} />
      <ColorManager
        onChange={onChange}
        value={value}
        onAddColor={canAdd ? onAddColor : undefined}
        onRemoveColor={canRemove ? onRemoveColor : undefined}
        hasButtons={hasButtons}
      />
    </div>
  );
};

ColorPicker.propTypes = {
  colors: PropTypes.array,
  hasButtons: PropTypes.bool,
  onAddColor: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  onRemoveColor: PropTypes.func,
  value: PropTypes.string,
};
