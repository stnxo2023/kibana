/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ComboBoxService } from '@kbn/test-suites-src/functional/services/combo_box';
import { services as deploymentAgnosticFunctionalServices } from './deployment_agnostic_services';
import { services as svlSharedServices } from '../../shared/services';
import { SvlChatNavigationServiceProvider } from './svl_chat_navigation';
import { SvlCommonNavigationServiceProvider } from './svl_common_navigation';
import { SvlObltNavigationServiceProvider } from './svl_oblt_navigation';
import { SvlSearchNavigationServiceProvider } from './svl_search_navigation';
import { SvlSecNavigationServiceProvider } from './svl_sec_navigation';
import { SvlCommonScreenshotsProvider } from './svl_common_screenshots';
import { SvlCasesServiceProvider } from '../../api_integration/services/svl_cases';
import { MachineLearningProvider } from './ml';
import { LogsSynthtraceProvider } from './log';
import { UISettingsServiceProvider } from './ui_settings';
import { services as SvlApiIntegrationSvcs } from '../../api_integration/services';

export const services = {
  // deployment agnostic FTR services
  ...deploymentAgnosticFunctionalServices,

  // serverless FTR services
  ...svlSharedServices,
  svlChatNavigation: SvlChatNavigationServiceProvider,
  svlCommonNavigation: SvlCommonNavigationServiceProvider,
  svlObltNavigation: SvlObltNavigationServiceProvider,
  svlSearchNavigation: SvlSearchNavigationServiceProvider,
  svlSecNavigation: SvlSecNavigationServiceProvider,
  svlCommonScreenshots: SvlCommonScreenshotsProvider,
  svlCases: SvlCasesServiceProvider,
  svlMl: MachineLearningProvider,
  uiSettings: UISettingsServiceProvider,
  // log services
  svlLogsSynthtraceClient: LogsSynthtraceProvider,
  alertingApi: SvlApiIntegrationSvcs.alertingApi,
  // EUI components
  comboBox: ComboBoxService,
};
