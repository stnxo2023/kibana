/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { omit } from 'lodash';
import { i18n } from '@kbn/i18n';
import { Assign } from '@kbn/utility-types';
import { ExpressionFunctionDefinition } from '@kbn/expressions-plugin/common';
import { NumericalRangeOutput } from '../../expressions';
import { AggExpressionType, AggExpressionFunctionArgs, BUCKET_TYPES } from '..';

export const aggRangeFnName = 'aggRange';

type Input = any;
type AggArgs = AggExpressionFunctionArgs<typeof BUCKET_TYPES.RANGE>;

type Arguments = Assign<AggArgs, { ranges?: NumericalRangeOutput[] }>;

type Output = AggExpressionType;
type FunctionDefinition = ExpressionFunctionDefinition<
  typeof aggRangeFnName,
  Input,
  Arguments,
  Output
>;

export const aggRange = (): FunctionDefinition => ({
  name: aggRangeFnName,
  help: i18n.translate('data.search.aggs.function.buckets.range.help', {
    defaultMessage: 'Generates a serialized agg config for a Range agg',
  }),
  type: 'agg_type',
  args: {
    id: {
      types: ['string'],
      help: i18n.translate('data.search.aggs.buckets.range.id.help', {
        defaultMessage: 'ID for this aggregation',
      }),
    },
    enabled: {
      types: ['boolean'],
      default: true,
      help: i18n.translate('data.search.aggs.buckets.range.enabled.help', {
        defaultMessage: 'Specifies whether this aggregation should be enabled',
      }),
    },
    schema: {
      types: ['string'],
      help: i18n.translate('data.search.aggs.buckets.range.schema.help', {
        defaultMessage: 'Schema to use for this aggregation',
      }),
    },
    field: {
      types: ['string'],
      required: true,
      help: i18n.translate('data.search.aggs.buckets.range.field.help', {
        defaultMessage: 'Field to use for this aggregation',
      }),
    },
    ranges: {
      types: ['numerical_range'],
      multi: true,
      help: i18n.translate('data.search.aggs.buckets.range.ranges.help', {
        defaultMessage: 'Serialized ranges to use for this aggregation.',
      }),
    },
    json: {
      types: ['string'],
      help: i18n.translate('data.search.aggs.buckets.range.json.help', {
        defaultMessage: 'Advanced json to include when the agg is sent to Elasticsearch',
      }),
    },
    customLabel: {
      types: ['string'],
      help: i18n.translate('data.search.aggs.buckets.range.customLabel.help', {
        defaultMessage: 'Represents a custom label for this aggregation',
      }),
    },
  },
  fn: (input, { id, enabled, schema, ranges, ...params }) => {
    return {
      type: 'agg_type',
      value: {
        id,
        enabled,
        schema,
        params: {
          ...params,
          ranges: ranges?.map((range) => omit(range, 'type')),
        },
        type: BUCKET_TYPES.RANGE,
      },
    };
  },
});
