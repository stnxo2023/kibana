/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CoreStart } from '@kbn/core/public';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { Storage } from '@kbn/kibana-utils-plugin/public';
import type { ObservabilityPublicPluginsStart } from '../plugin';
import { TelemetryServiceStart } from '../services/telemetry/types';

export type StartServices<AdditionalServices extends object = {}> = CoreStart &
  ObservabilityPublicPluginsStart &
  AdditionalServices & {
    storage: Storage;
    kibanaVersion: string;
    telemetryClient: TelemetryServiceStart;
  };
const useTypedKibana = <AdditionalServices extends object = {}>() =>
  useKibana<StartServices<AdditionalServices>>();

export { useTypedKibana as useKibana };
