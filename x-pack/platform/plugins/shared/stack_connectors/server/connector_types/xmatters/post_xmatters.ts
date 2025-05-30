/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { Logger } from '@kbn/core/server';
import type { ActionsConfigurationUtilities } from '@kbn/actions-plugin/server/actions_config';
import { request } from '@kbn/actions-plugin/server/lib/axios_utils';
import { combineHeadersWithBasicAuthHeader } from '@kbn/actions-plugin/server/lib';
import type { ConnectorUsageCollector } from '@kbn/actions-plugin/server/types';

interface PostXmattersOptions {
  url: string;
  data: {
    alertActionGroupName?: string;
    signalId?: string;
    ruleName?: string;
    date?: string;
    severity: string;
    spaceId?: string;
    tags?: string;
  };
  basicAuth?: {
    auth: {
      username: string;
      password: string;
    };
  };
}

// trigger a flow in xmatters
export async function postXmatters(
  options: PostXmattersOptions,
  logger: Logger,
  configurationUtilities: ActionsConfigurationUtilities,
  connectorUsageCollector: ConnectorUsageCollector
): Promise<AxiosResponse> {
  const { url, data, basicAuth } = options;
  const axiosInstance = axios.create();
  return await request({
    axios: axiosInstance,
    method: 'post',
    url,
    logger,
    headers: combineHeadersWithBasicAuthHeader({
      username: basicAuth?.auth.username,
      password: basicAuth?.auth.password,
    }),
    data,
    configurationUtilities,
    validateStatus: () => true,
    connectorUsageCollector,
  });
}
