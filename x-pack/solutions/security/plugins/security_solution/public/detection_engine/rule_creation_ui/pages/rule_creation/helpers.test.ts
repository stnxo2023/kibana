/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { List } from '@kbn/securitysolution-io-ts-list-types';
import { actionTypeRegistryMock } from '@kbn/triggers-actions-ui-plugin/public/application/action_type_registry.mock';
import type { ActionTypeRegistryContract } from '@kbn/alerts-ui-shared';

import type { RuleCreateProps } from '../../../../../common/api/detection_engine/model/rule_schema';
import type { Rule } from '../../../rule_management/logic';
import {
  getEndpointListMock,
  getListMock,
} from '../../../../../common/detection_engine/schemas/types/lists.mock';
import type {
  AboutStepRule,
  AboutStepRuleJson,
  ActionsStepRule,
  ActionsStepRuleJson,
  DefineStepRule,
  DefineStepRuleJson,
  ScheduleStepRule,
  ScheduleStepRuleJson,
} from '../../../common/types';
import { AlertSuppressionDurationType } from '../../../common/types';
import {
  filterEmptyThreats,
  filterRuleFieldsForType,
  formatAboutStepData,
  formatActionsStepData,
  formatDefineStepData,
  formatRule,
  formatScheduleStepData,
} from './helpers';
import {
  mockAboutStepRule,
  mockActionsStepRule,
  mockDefineStepRule,
  mockQueryBar,
  mockScheduleStepRule,
} from '../../../rule_management_ui/components/rules_table/__mocks__/mock';
import { getThreatMock } from '../../../../../common/detection_engine/schemas/types/threat.mock';
import type { Threat, Threats } from '@kbn/securitysolution-io-ts-alerting-types';
import {
  ALERT_SUPPRESSION_DURATION_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_UNIT_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_VALUE_FIELD_NAME,
  ALERT_SUPPRESSION_FIELDS_FIELD_NAME,
} from '../../../rule_creation/components/alert_suppression_edit';

describe('helpers', () => {
  describe('filterEmptyThreats', () => {
    let mockThreat: Threat;

    beforeEach(() => {
      mockThreat = mockAboutStepRule().threat[0];
    });

    test('filters out fields with empty tactics', () => {
      const threat: Threats = [
        mockThreat,
        { ...mockThreat, tactic: { ...mockThreat.tactic, name: 'none' } },
      ];
      const result = filterEmptyThreats(threat);
      const expected: Threats = [mockThreat];
      expect(result).toEqual(expected);
    });
  });

  describe('formatDefineStepData', () => {
    let mockData: DefineStepRule;

    beforeEach(() => {
      mockData = mockDefineStepRule();
    });

    test('returns formatted object as DefineStepRuleJson', () => {
      const result = formatDefineStepData(mockData);
      const expected: DefineStepRuleJson = {
        language: 'kuery',
        filters: mockQueryBar.filters,
        query: 'test query',
        index: ['filebeat-'],
        type: 'query',
        timeline_id: '86aa74d0-2136-11ea-9864-ebc8cc1cb8c2',
        timeline_title: 'Titled timeline',
        related_integrations: [
          {
            package: 'aws',
            integration: 'route53',
            version: '~1.2.3',
          },
          {
            package: 'system',
            version: '^1.2.3',
          },
        ],
        required_fields: [{ name: 'host.name', type: 'keyword' }],
      };

      expect(result).toEqual(expected);
    });

    test('filters out empty related integrations', () => {
      const result = formatDefineStepData({
        ...mockData,
        relatedIntegrations: [
          { package: '', version: '' },
          {
            package: 'aws',
            integration: 'route53',
            version: '~1.2.3',
          },
          { package: '', version: '' },
          {
            package: 'system',
            version: '^1.2.3',
          },
        ],
      });

      expect(result).toMatchObject({
        related_integrations: [
          {
            package: 'aws',
            integration: 'route53',
            version: '~1.2.3',
          },
          {
            package: 'system',
            version: '^1.2.3',
          },
        ],
      });
    });

    test('filters out empty required fields', () => {
      const result = formatDefineStepData({
        ...mockData,
        requiredFields: [
          { name: 'host.name', type: 'keyword' },
          { name: '', type: '' },
        ],
      });

      expect(result).toMatchObject({
        required_fields: [{ name: 'host.name', type: 'keyword' }],
      });
    });

    describe('saved_query and query rule types', () => {
      test('returns query rule if savedId provided but shouldLoadQueryDynamically != true', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: 'mock-test-id',
          },
          ruleType: 'query',
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBeUndefined();
        expect(result.type).toBe('query');
        expect(result.query).toBe('test query');
      });

      test('returns query rule if shouldLoadQueryDynamically = true and savedId not provided for rule type query', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: null,
          },
          ruleType: 'query',
          shouldLoadQueryDynamically: true,
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBeUndefined();
        expect(result.type).toBe('query');
        expect(result.query).toBe('test query');
      });

      test('returns query rule if shouldLoadQueryDynamically = true and savedId not provided for rule type saved_query', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: null,
          },
          ruleType: 'saved_query',
          shouldLoadQueryDynamically: true,
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBeUndefined();
        expect(result.type).toBe('query');
        expect(result.query).toBe('test query');
      });

      test('returns query rule type if savedId provided but shouldLoadQueryDynamically != true and rule type is saved_query', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: 'mock-test-id',
          },
          ruleType: 'saved_query',
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBeUndefined();
        expect(result.type).toBe('query');
        expect(result.query).toBe('test query');
      });

      test('returns saved_query rule if shouldLoadQueryDynamically = true and savedId provided for rule type query', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: 'mock-test-id',
          },
          ruleType: 'query',
          shouldLoadQueryDynamically: true,
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBe('mock-test-id');
        expect(result.type).toBe('saved_query');
        expect(result.query).toBeUndefined();
      });

      test('returns saved_query rule if shouldLoadQueryDynamically = true and savedId provided for rule type saved_query', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          queryBar: {
            ...mockData.queryBar,
            saved_id: 'mock-test-id',
          },
          ruleType: 'saved_query',
          shouldLoadQueryDynamically: true,
        };
        const result = formatDefineStepData(mockStepData);

        expect(result.saved_id).toBe('mock-test-id');
        expect(result.type).toBe('saved_query');
        expect(result.query).toBeUndefined();
      });
    });

    test('returns undefined timeline_id and timeline_title if timeline.id is undefined', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
      };
      // @ts-expect-error
      delete mockStepData.timeline.id;

      const result = formatDefineStepData(mockStepData);

      expect(result.timeline_id).toBeUndefined();
      expect(result.timeline_title).toBeUndefined();
    });

    test('returns formatted timeline_id and timeline_title if timeline.id is empty string', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
        timeline: {
          ...mockData.timeline,
          id: '',
        },
      };
      const result = formatDefineStepData(mockStepData);

      expect(result.timeline_id).toBe('');
      expect(result.timeline_title).toEqual('Titled timeline');
    });

    test('returns undefined timeline_id and timeline_title if timeline.title is undefined', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
        timeline: {
          ...mockData.timeline,
          id: '86aa74d0-2136-11ea-9864-ebc8cc1cb8c2',
        },
      };
      // @ts-expect-error
      delete mockStepData.timeline.title;
      const result = formatDefineStepData(mockStepData);

      expect(result.timeline_id).toBeUndefined();
      expect(result.timeline_title).toBeUndefined();
    });

    test('returns formatted object with timeline_id and timeline_title if timeline.title is empty string', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
        timeline: {
          ...mockData.timeline,
          title: '',
        },
      };
      const result = formatDefineStepData(mockStepData);

      expect(result.timeline_id).toBe('86aa74d0-2136-11ea-9864-ebc8cc1cb8c2');
      expect(result.timeline_title).toEqual('');
    });

    test('returns ML fields if type is machine_learning', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
        ruleType: 'machine_learning',
        anomalyThreshold: 44,
        machineLearningJobId: ['some_jobert_id'],
      };
      const result = formatDefineStepData(mockStepData);

      const expected: DefineStepRuleJson = {
        type: 'machine_learning',
        anomaly_threshold: 44,
        machine_learning_job_id: ['some_jobert_id'],
        timeline_id: '86aa74d0-2136-11ea-9864-ebc8cc1cb8c2',
        timeline_title: 'Titled timeline',
        related_integrations: [
          {
            package: 'aws',
            integration: 'route53',
            version: '~1.2.3',
          },
          {
            package: 'system',
            version: '^1.2.3',
          },
        ],
      };

      expect(result).toEqual(expected);
    });

    describe('Eql', () => {
      test('returns query fields if type is eql', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          ruleType: 'eql',
          queryBar: {
            ...mockData.queryBar,
            query: {
              ...mockData.queryBar.query,
              language: 'eql',
              query: 'process where process_name == "explorer.exe"',
            },
          },
        };
        const result = formatDefineStepData(mockStepData);

        const expected: DefineStepRuleJson = {
          filters: mockStepData.queryBar.filters,
          index: mockStepData.index,
          language: 'eql',
          query: 'process where process_name == "explorer.exe"',
          type: 'eql',
        };

        expect(result).toEqual(expect.objectContaining(expected));
      });

      test('returns option fields if specified for eql type', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          ruleType: 'eql',
          queryBar: {
            ...mockData.queryBar,
            query: {
              ...mockData.queryBar.query,
              language: 'eql',
              query: 'process where process_name == "explorer.exe"',
            },
          },
          eqlOptions: {
            timestampField: 'event.created',
            tiebreakerField: 'process.name',
            eventCategoryField: 'event.action',
          },
        };
        const result = formatDefineStepData(mockStepData);

        const expected: DefineStepRuleJson = {
          filters: mockStepData.queryBar.filters,
          index: mockStepData.index,
          language: 'eql',
          query: 'process where process_name == "explorer.exe"',
          type: 'eql',
          timestamp_field: 'event.created',
          tiebreaker_field: 'process.name',
          event_category_override: 'event.action',
        };

        expect(result).toEqual(expect.objectContaining(expected));
      });
      test('should return suppression fields for eql type', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          ruleType: 'eql',
          queryBar: {
            ...mockData.queryBar,
            query: {
              ...mockData.queryBar.query,
              language: 'eql',
              query: 'process where process_name == "explorer.exe"',
            },
          },
          [ALERT_SUPPRESSION_FIELDS_FIELD_NAME]: ['event.type'],
          [ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME]:
            AlertSuppressionDurationType.PerRuleExecution,
        };
        const result = formatDefineStepData(mockStepData);

        const expected: DefineStepRuleJson = {
          filters: mockStepData.queryBar.filters,
          index: mockStepData.index,
          language: 'eql',
          query: 'process where process_name == "explorer.exe"',
          type: 'eql',
          alert_suppression: {
            group_by: ['event.type'],
            duration: undefined,
            missing_fields_strategy: 'suppress',
          },
        };

        expect(result).toEqual(expect.objectContaining(expected));
      });

      test('should return suppression fields with duration PerTimePeriod for eql type', () => {
        const mockStepData: DefineStepRule = {
          ...mockData,
          ruleType: 'eql',
          queryBar: {
            ...mockData.queryBar,
            query: {
              ...mockData.queryBar.query,
              language: 'eql',
              query: 'process where process_name == "explorer.exe"',
            },
          },
          [ALERT_SUPPRESSION_FIELDS_FIELD_NAME]: ['event.type'],
          [ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME]: AlertSuppressionDurationType.PerTimePeriod,
          [ALERT_SUPPRESSION_DURATION_FIELD_NAME]: { value: 10, unit: 'm' },
        };
        const result = formatDefineStepData(mockStepData);

        const expected: DefineStepRuleJson = {
          filters: mockStepData.queryBar.filters,
          index: mockStepData.index,
          language: 'eql',
          query: 'process where process_name == "explorer.exe"',
          type: 'eql',
          alert_suppression: {
            group_by: ['event.type'],
            duration: { value: 10, unit: 'm' },
            missing_fields_strategy: 'suppress',
          },
        };

        expect(result).toEqual(expect.objectContaining(expected));
      });
    });

    test('returns expected indicator matching rule type if all fields are filled out', () => {
      const threatFilters: DefineStepRule['threatQueryBar']['filters'] = [
        {
          meta: { alias: '', disabled: false, negate: false },
          query: {
            bool: {
              filter: [
                {
                  bool: {
                    minimum_should_match: 1,
                    should: [{ exists: { field: 'host.name' } }],
                  },
                },
                {},
              ],
              must: [],
              must_not: [],
              should: [],
            },
          },
        },
      ];
      const threatMapping: DefineStepRule['threatMapping'] = [
        {
          entries: [
            {
              field: 'host.name',
              type: 'mapping',
              value: 'host.name',
            },
          ],
        },
      ];
      const mockStepData: DefineStepRule = {
        ...mockData,
        ruleType: 'threat_match',
        threatIndex: ['index_1', 'index_2'],
        threatQueryBar: {
          query: { language: 'kql', query: 'threat_host: *' },
          filters: threatFilters,
          saved_id: null,
        },
        threatMapping,
      };
      const result = formatDefineStepData(mockStepData);

      const expected: DefineStepRuleJson = {
        language: 'kuery',
        query: 'test query',
        saved_id: 'test123',
        type: 'threat_match',
        threat_query: 'threat_host: *',
        timeline_id: '86aa74d0-2136-11ea-9864-ebc8cc1cb8c2',
        timeline_title: 'Titled timeline',
        threat_mapping: threatMapping,
        threat_language: mockStepData.threatQueryBar.query.language,
        filters: mockStepData.queryBar.filters,
        threat_index: mockStepData.threatIndex,
        index: mockStepData.index,
        threat_filters: threatFilters,
        related_integrations: [
          {
            package: 'aws',
            integration: 'route53',
            version: '~1.2.3',
          },
          {
            package: 'system',
            version: '^1.2.3',
          },
        ],
        required_fields: [{ name: 'host.name', type: 'keyword' }],
      };

      expect(result).toEqual(expected);
    });

    it('returns suppression fields for machine_learning rules', () => {
      const mockStepData: DefineStepRule = {
        ...mockData,
        ruleType: 'machine_learning',
        machineLearningJobId: ['some_jobert_id'],
        anomalyThreshold: 44,
        [ALERT_SUPPRESSION_FIELDS_FIELD_NAME]: ['event.type'],
        [ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME]: AlertSuppressionDurationType.PerTimePeriod,
        [ALERT_SUPPRESSION_DURATION_FIELD_NAME]: {
          [ALERT_SUPPRESSION_DURATION_VALUE_FIELD_NAME]: 10,
          [ALERT_SUPPRESSION_DURATION_UNIT_FIELD_NAME]: 'm',
        },
      };
      const result = formatDefineStepData(mockStepData);

      const expected: DefineStepRuleJson = {
        machine_learning_job_id: ['some_jobert_id'],
        anomaly_threshold: 44,
        type: 'machine_learning',
        alert_suppression: {
          group_by: ['event.type'],
          duration: { value: 10, unit: 'm' },
          missing_fields_strategy: 'suppress',
        },
      };

      expect(result).toEqual(expect.objectContaining(expected));
    });
  });

  describe('formatScheduleStepData', () => {
    let mockData: ScheduleStepRule;

    beforeEach(() => {
      mockData = mockScheduleStepRule();
    });

    test('returns formatted object as ScheduleStepRuleJson', () => {
      const result = formatScheduleStepData(mockData);
      const expected: ScheduleStepRuleJson = {
        from: 'now-11m',
        to: 'now',
        interval: '5m',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with "to" as "now" if "to" not supplied', () => {
      const mockStepData: ScheduleStepRule = {
        ...mockData,
      };
      delete mockStepData.to;
      const result = formatScheduleStepData(mockStepData);
      const expected: ScheduleStepRuleJson = {
        from: 'now-11m',
        to: 'now',
        interval: '5m',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with "to" as "now" if "to" random string', () => {
      const mockStepData: ScheduleStepRule = {
        ...mockData,
        to: 'random',
      };
      const result = formatScheduleStepData(mockStepData);
      const expected: ScheduleStepRuleJson = {
        from: 'now-11m',
        to: 'now',
        interval: '5m',
      };

      expect(result).toEqual(expected);
    });

    test('returns unchanged data when "from" is a random string', () => {
      const mockStepData: ScheduleStepRule = {
        ...mockData,
        from: 'random',
      };

      const result = formatScheduleStepData(mockStepData);

      expect(result).toMatchObject(mockStepData);
    });

    test('returns unchanged data when "interval" is a random string', () => {
      const mockStepData: ScheduleStepRule = {
        ...mockData,
        interval: 'random',
      };

      const result = formatScheduleStepData(mockStepData);

      expect(result).toMatchObject(mockStepData);
    });
  });

  describe('formatAboutStepData', () => {
    let mockData: AboutStepRule;

    beforeEach(() => {
      mockData = mockAboutStepRule();
    });

    test('returns formatted object as AboutStepRuleJson', () => {
      const result = formatAboutStepData(mockData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    // Users are allowed to input 0 in the form, but value is validated in the API layer
    test('returns formatted object with max_signals set to 0', () => {
      const mockDataWithZeroMaxSignals: AboutStepRule = {
        ...mockData,
        maxSignals: 0,
      };

      const result = formatAboutStepData(mockDataWithZeroMaxSignals);

      expect(result.max_signals).toEqual(0);
    });

    // Strings or empty values are replaced with undefined and overriden with the default value of 1000
    test('returns formatted object with undefined max_signals for non-integer values inputs', () => {
      const mockDataWithNonIntegerMaxSignals: AboutStepRule = {
        ...mockData,
        // @ts-expect-error
        maxSignals: '',
      };

      const result = formatAboutStepData(mockDataWithNonIntegerMaxSignals);

      expect(result.max_signals).toEqual(undefined);
    });

    test('returns formatted object with endpoint exceptions_list', () => {
      const result = formatAboutStepData(
        {
          ...mockData,
          isAssociatedToEndpointList: true,
        },
        []
      );
      expect(result.exceptions_list).toEqual([getEndpointListMock()]);
    });

    test('returns formatted object with detections exceptions_list', () => {
      const result = formatAboutStepData(mockData, [getListMock()]);
      expect(result.exceptions_list).toEqual([getListMock()]);
    });

    test('returns a threat indicator path', () => {
      mockData = {
        ...mockData,
        threatIndicatorPath: 'my_custom.path',
      };
      const result = formatAboutStepData(mockData);
      expect(result.threat_indicator_path).toEqual('my_custom.path');
    });

    test('returns formatted object with both exceptions_lists', () => {
      const result = formatAboutStepData(
        {
          ...mockData,
          isAssociatedToEndpointList: true,
        },
        [getListMock()]
      );
      expect(result.exceptions_list).toEqual([getEndpointListMock(), getListMock()]);
    });

    test('returns formatted object with pre-existing exceptions lists', () => {
      const exceptionsLists: List[] = [getEndpointListMock(), getListMock()];
      const result = formatAboutStepData(
        {
          ...mockData,
          isAssociatedToEndpointList: true,
        },
        exceptionsLists
      );
      expect(result.exceptions_list).toEqual(exceptionsLists);
    });

    test('returns formatted object with pre-existing endpoint exceptions list disabled', () => {
      const exceptionsLists: List[] = [getEndpointListMock(), getListMock()];
      const result = formatAboutStepData(mockData, exceptionsLists);
      expect(result.exceptions_list).toEqual([getListMock()]);
    });

    test('returns formatted object with empty falsePositive and references filtered out', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        falsePositives: ['', 'test', ''],
        references: ['www.test.co', ''],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object without note if note is empty string', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        note: '',
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with threats filtered out where tactic.name is "none"', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        threat: [
          ...getThreatMock(),
          {
            framework: 'mockFramework',
            tactic: {
              id: '1234',
              name: 'none',
              reference: 'reference1',
            },
            technique: [
              {
                id: '456',
                name: 'technique1',
                reference: 'technique reference',
                subtechnique: [],
              },
            ],
          },
        ],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        license: 'Elastic License',
        description: '24/7',
        false_positives: ['test'],
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with threats that contains no subtechniques', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        threat: [
          ...getThreatMock(),
          {
            framework: 'mockFramework',
            tactic: {
              id: '1234',
              name: 'tactic1',
              reference: 'reference1',
            },
            technique: [
              {
                id: '456',
                name: 'technique1',
                reference: 'technique reference',
                subtechnique: [],
              },
            ],
          },
        ],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        license: 'Elastic License',
        description: '24/7',
        false_positives: ['test'],
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: [
          ...getThreatMock(),
          {
            framework: 'MITRE ATT&CK',
            tactic: { id: '1234', name: 'tactic1', reference: 'reference1' },
            technique: [
              { id: '456', name: 'technique1', reference: 'technique reference', subtechnique: [] },
            ],
          },
        ],
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with timestamp override', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        timestampOverride: 'event.ingest',
        timestampOverrideFallbackDisabled: true,
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        timestamp_override: 'event.ingest',
        timestamp_override_fallback_disabled: true,
        investigation_fields: { field_names: ['foo', 'bar'] },
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object if investigationFields is empty array', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        investigationFields: [],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        rule_name_override: undefined,
        threat_indicator_path: undefined,
        timestamp_override: undefined,
        timestamp_override_fallback_disabled: undefined,
        threat: getThreatMock(),
        investigation_fields: undefined,
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object with investigation_fields', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        investigationFields: ['foo', 'bar'],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: { field_names: ['foo', 'bar'] },
        threat_indicator_path: undefined,
        timestamp_override: undefined,
        timestamp_override_fallback_disabled: undefined,
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });

    test('returns formatted object if investigation_fields includes empty string', () => {
      const mockStepData: AboutStepRule = {
        ...mockData,
        investigationFields: ['  '],
      };
      const result = formatAboutStepData(mockStepData);
      const expected: AboutStepRuleJson = {
        author: ['Elastic'],
        description: '24/7',
        false_positives: ['test'],
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        risk_score: 21,
        risk_score_mapping: [],
        severity: 'low',
        severity_mapping: [],
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        investigation_fields: undefined,
        threat_indicator_path: undefined,
        timestamp_override: undefined,
        timestamp_override_fallback_disabled: undefined,
        max_signals: 100,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(expected);
    });
  });

  describe('formatActionsStepData', () => {
    let mockData: ActionsStepRule;
    const actionTypeRegistry = {
      ...actionTypeRegistryMock.create(),
      get: jest.fn((actionTypeId: string) => ({
        isSystemAction: false,
      })),
    } as unknown as jest.Mocked<ActionTypeRegistryContract>;

    beforeEach(() => {
      mockData = mockActionsStepRule();
    });

    test('returns formatted object as ActionsStepRuleJson', () => {
      const result = formatActionsStepData(mockData, actionTypeRegistry);
      const expected: ActionsStepRuleJson = {
        actions: [],
        enabled: false,
        meta: {
          kibana_siem_app_url: 'http://localhost:5601/app/siem',
        },
      };

      expect(result).toEqual(expected);
    });

    test('returns actions with action_type_id', () => {
      const mockAction = {
        group: 'default',
        id: '99403909-ca9b-49ba-9d7a-7e5320e68d05',
        params: { message: 'ML Rule generated {{state.signals_count}} alerts' },
        actionTypeId: '.slack',
      };

      const mockStepData: ActionsStepRule = {
        ...mockData,
        actions: [mockAction],
      };
      const result = formatActionsStepData(mockStepData, actionTypeRegistry);
      const expected: ActionsStepRuleJson = {
        actions: [
          {
            group: mockAction.group,
            id: mockAction.id,
            params: mockAction.params,
            action_type_id: mockAction.actionTypeId,
          },
        ],
        enabled: false,
        meta: {
          kibana_siem_app_url: mockStepData.kibanaSiemAppUrl,
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('formatRule', () => {
    let mockAbout: AboutStepRule;
    let mockDefine: DefineStepRule;
    let mockSchedule: ScheduleStepRule;
    let mockActions: ActionsStepRule;
    const actionTypeRegistry = actionTypeRegistryMock.create();

    beforeEach(() => {
      mockAbout = mockAboutStepRule();
      mockDefine = mockDefineStepRule();
      mockSchedule = mockScheduleStepRule();
      mockActions = mockActionsStepRule();
    });

    test('returns rule with type of query when saved_id exists but shouldLoadQueryDynamically=false', () => {
      const result = formatRule<Rule>(
        mockDefine,
        mockAbout,
        mockSchedule,
        mockActions,
        actionTypeRegistry
      );

      expect(result.type).toEqual('query');
    });

    test('returns rule with type of saved_query when saved_id exists and shouldLoadQueryDynamically=true', () => {
      const result = formatRule<Rule>(
        { ...mockDefine, shouldLoadQueryDynamically: true },
        mockAbout,
        mockSchedule,
        mockActions,
        actionTypeRegistry
      );

      expect(result.type).toEqual('saved_query');
    });

    test('returns rule with type of query when saved_id does not exist', () => {
      const mockDefineStepRuleWithoutSavedId: DefineStepRule = {
        ...mockDefine,
        queryBar: {
          ...mockDefine.queryBar,
          saved_id: '',
        },
      };
      const result = formatRule<RuleCreateProps>(
        mockDefineStepRuleWithoutSavedId,
        mockAbout,
        mockSchedule,
        mockActions,
        actionTypeRegistry
      );

      expect(result.type).toEqual('query');
    });

    test('returns rule without id if ruleId does not exist', () => {
      const result = formatRule<RuleCreateProps>(
        mockDefine,
        mockAbout,
        mockSchedule,
        mockActions,
        actionTypeRegistry
      );

      expect(result).not.toHaveProperty<RuleCreateProps>('id');
    });
  });

  describe('filterRuleFieldsForType', () => {
    let fields: DefineStepRule;

    beforeEach(() => {
      fields = mockDefineStepRule();
    });

    it('removes query fields if the type is machine learning', () => {
      const result = filterRuleFieldsForType(fields, 'machine_learning');
      expect(result).not.toHaveProperty('index');
      expect(result).not.toHaveProperty('queryBar');
    });

    it('leaves ML fields if the type is machine learning', () => {
      const result = filterRuleFieldsForType(fields, 'machine_learning');
      expect(result).toHaveProperty('anomalyThreshold');
      expect(result).toHaveProperty('machineLearningJobId');
    });

    it('leaves arbitrary fields if the type is machine learning', () => {
      const result = filterRuleFieldsForType(fields, 'machine_learning');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('ruleType');
    });

    it('removes ML fields if the type is not machine learning', () => {
      const result = filterRuleFieldsForType(fields, 'query');
      expect(result).not.toHaveProperty('anomalyThreshold');
      expect(result).not.toHaveProperty('machineLearningJobId');
    });

    it('leaves query fields if the type is query', () => {
      const result = filterRuleFieldsForType(fields, 'query');
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('queryBar');
    });

    it('leaves arbitrary fields if the type is query', () => {
      const result = filterRuleFieldsForType(fields, 'query');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('ruleType');
    });
  });
});
