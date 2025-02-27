/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { fieldConstants } from '@kbn/discover-utils';
import { SmartFieldGridColumnOptions } from './display_options';

export * from '@kbn/discover-utils/src/field_constants';

export const LOGS_EXPLORER_PROFILE_ID = 'logs-explorer';

// Virtual column fields
export const CONTENT_FIELD = 'content';
export const RESOURCE_FIELD = 'resource';

// Sizing
export const DATA_GRID_COLUMN_WIDTH_SMALL = 240;
export const DATA_GRID_COLUMN_WIDTH_MEDIUM = 320;
export const ACTIONS_COLUMN_WIDTH = 80;

export const RESOURCE_FIELD_CONFIGURATION: SmartFieldGridColumnOptions = {
  type: 'smart-field',
  smartField: RESOURCE_FIELD,
  fallbackFields: [fieldConstants.HOST_NAME_FIELD, fieldConstants.SERVICE_NAME_FIELD],
  width: DATA_GRID_COLUMN_WIDTH_MEDIUM,
};

export const CONTENT_FIELD_CONFIGURATION: SmartFieldGridColumnOptions = {
  type: 'smart-field',
  smartField: CONTENT_FIELD,
  fallbackFields: [fieldConstants.MESSAGE_FIELD],
};

export const SMART_FALLBACK_FIELDS = {
  [CONTENT_FIELD]: CONTENT_FIELD_CONFIGURATION,
  [RESOURCE_FIELD]: RESOURCE_FIELD_CONFIGURATION,
};

// UI preferences
export const DEFAULT_COLUMNS = [
  /**
   * We are switching from these virtual columns to the One Discover Summary column.
   * In this effort we don't want to immediately cleanup everything about these virtual columns,
   * but only disable their instantiation.
   * We'll clean this part as soon as we decide to definitevely discard these columns.
   **/
  // RESOURCE_FIELD_CONFIGURATION,
  //  CONTENT_FIELD_CONFIGURATION
];
export const DEFAULT_ROW_COUNT = 1;
export const DEFAULT_ROWS_PER_PAGE = 100;

// List of prefixes which needs to be filtered out for Display in Content Column
export const FILTER_OUT_FIELDS_PREFIXES_FOR_CONTENT = [
  '_', // Filter fields like '_id', '_score'
  '@timestamp',
  'agent.',
  'elastic_agent.',
  'data_stream.',
  'ecs.',
  'host.',
  'container.',
  'cloud.',
  'kubernetes.',
  'orchestrator.',
  'log.',
  'service.',
];
