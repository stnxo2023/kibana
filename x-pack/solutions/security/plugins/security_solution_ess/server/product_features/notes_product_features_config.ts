/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type {
  ProductFeatureKeys,
  ProductFeatureKibanaConfig,
  ProductFeaturesNotesConfig,
} from '@kbn/security-solution-features';
import {
  notesDefaultProductFeaturesConfig,
  createEnabledProductFeaturesConfigMap,
} from '@kbn/security-solution-features/config';
import type { ProductFeatureNotesFeatureKey } from '@kbn/security-solution-features/keys';

/**
 * Maps the ProductFeatures keys to Kibana privileges that will be merged
 * into the base privileges config for the app.
 *
 * Privileges can be added in different ways:
 * - `privileges`: the privileges that will be added directly into the main Attack discovery feature.
 * - `subFeatureIds`: the ids of the sub-features that will be added into the Attack discovery subFeatures entry.
 * - `subFeaturesPrivileges`: the privileges that will be added into the existing Attack discovery subFeature with the privilege `id` specified.
 */
const notesProductFeaturesConfig: Record<
  ProductFeatureNotesFeatureKey,
  ProductFeatureKibanaConfig
> = {
  ...notesDefaultProductFeaturesConfig,
  // ess-specific app features configs here
};

export const getNotesProductFeaturesConfigurator =
  (enabledProductFeatureKeys: ProductFeatureKeys) => (): ProductFeaturesNotesConfig =>
    createEnabledProductFeaturesConfigMap(notesProductFeaturesConfig, enabledProductFeatureKeys);
