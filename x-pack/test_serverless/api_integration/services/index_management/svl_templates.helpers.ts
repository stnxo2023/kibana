/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  TemplateDeserialized,
  TemplateSerialized,
  IndexMode,
} from '@kbn/index-management-plugin/common';
import { INDEX_PATTERNS } from './constants';
import { FtrProviderContext } from '../../ftr_provider_context';

const templateMock = {
  settings: {},
  mappings: {
    properties: {
      host_name: {
        type: 'keyword',
      },
      created_at: {
        type: 'date',
        format: 'EEE MMM dd HH:mm:ss Z yyyy',
      },
    },
  },
  aliases: {
    alias1: {},
  },
};

const getTemplateMock = (isMappingsSourceFieldEnabled: boolean) => {
  if (isMappingsSourceFieldEnabled) {
    return {
      ...templateMock,
      mappings: {
        ...templateMock.mappings,
        _source: {
          enabled: false,
        },
      },
    };
  }
  return templateMock;
};

export function SvlTemplatesHelpers({ getService }: FtrProviderContext) {
  const es = getService('es');

  const catTemplate = (name: string) => es.cat.templates({ name, format: 'json' }, { meta: true });

  const getTemplatePayload = (
    name: string,
    indexPatterns: string[] = INDEX_PATTERNS,
    isLegacy: boolean = false,
    isMappingsSourceFieldEnabled: boolean = true,
    indexMode?: IndexMode
  ) => {
    const baseTemplate: TemplateDeserialized = {
      name,
      indexPatterns,
      indexMode,
      version: 1,
      template: { ...getTemplateMock(isMappingsSourceFieldEnabled) },
      _kbnMeta: {
        isLegacy,
        type: 'default',
        hasDatastream: false,
      },
      allowAutoCreate: 'NO_OVERWRITE',
    };

    if (isLegacy) {
      baseTemplate.order = 1;
    } else {
      baseTemplate.priority = 1;
    }

    return baseTemplate;
  };

  const getSerializedTemplate = (
    indexPatterns: string[] = INDEX_PATTERNS,
    isMappingsSourceFieldEnabled: boolean = true
  ): TemplateSerialized => {
    return {
      index_patterns: indexPatterns,
      template: { ...getTemplateMock(isMappingsSourceFieldEnabled) },
    };
  };

  return {
    catTemplate,
    getTemplatePayload,
    getSerializedTemplate,
  };
}
