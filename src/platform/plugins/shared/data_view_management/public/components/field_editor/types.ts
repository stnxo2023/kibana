/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ReactText } from 'react';
import { Query } from '@kbn/es-query';
import { HttpStart } from '@kbn/core/public';
import type { estypes } from '@elastic/elasticsearch';

export type SampleInput = ReactText | ReactText[] | Record<string, ReactText | ReactText[]>;
export interface Sample {
  input: SampleInput;
  output: string;
}

export interface ExecuteScriptParams {
  name: string;
  script: string;
  indexPatternTitle: string;
  query?: Query['query'];
  additionalFields?: string[];
  http: HttpStart;
}

export interface ExecuteScriptResult {
  status: number;
  hits?: { hits: Array<estypes.SearchHit<object>> };
  error?: unknown;
}

export type ExecuteScript = (params: ExecuteScriptParams) => Promise<ExecuteScriptResult>;
