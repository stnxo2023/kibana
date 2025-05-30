/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiIconTip,
  EuiText,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { RuleSummary, RuleType } from '../../../../types';
import { useKibana } from '../../../../common/lib/kibana';
import { CenterJustifiedSpinner } from '../../../components/center_justified_spinner';
import { ExecutionDurationChart } from '../../common/components/execution_duration_chart';
import {
  formatMillisForDisplay,
  shouldShowDurationWarning,
} from '../../../lib/execution_duration_utils';
import {
  ComponentOpts as RuleApis,
  withBulkRuleOperations,
} from '../../common/components/with_bulk_rule_api_operations';
import { RefreshToken } from './types';

export const DEFAULT_NUMBER_OF_EXECUTIONS = 60;

type RuleExecutionSummaryAndChartProps = {
  ruleId: string;
  ruleType: RuleType;
  ruleSummary?: RuleSummary;
  numberOfExecutions?: number;
  isLoadingRuleSummary?: boolean;
  refreshToken?: RefreshToken;
  onChangeDuration?: (duration: number) => void;
  requestRefresh?: () => Promise<void>;
  fetchRuleSummary?: boolean;
} & Pick<RuleApis, 'loadRuleSummary'>;

const ruleTypeExcessDurationMessage = i18n.translate(
  'xpack.triggersActionsUI.sections.ruleDetails.alertsList.ruleTypeExcessDurationMessage',
  {
    defaultMessage: `Duration exceeds the rule's expected run time.`,
  }
);

export const RuleExecutionSummaryAndChart = (props: RuleExecutionSummaryAndChartProps) => {
  const {
    ruleId,
    ruleType,
    ruleSummary,
    refreshToken,
    fetchRuleSummary = false,
    numberOfExecutions = DEFAULT_NUMBER_OF_EXECUTIONS,
    onChangeDuration,
    loadRuleSummary,
    isLoadingRuleSummary = false,
  } = props;

  const {
    notifications: { toasts },
  } = useKibana().services;
  const { euiTheme } = useEuiTheme();

  const isInitialized = useRef(false);

  const ruleDurationWarningIconCss = css`
    bottom: ${euiTheme.size.xs};
    position: relative;
  `;

  const [internalRuleSummary, setInternalRuleSummary] = useState<RuleSummary | null>(null);
  const [internalNumberOfExecutions, setInternalNumberOfExecutions] = useState(
    DEFAULT_NUMBER_OF_EXECUTIONS
  );
  const [internalIsLoadingRuleSummary, setInternalIsLoadingRuleSummary] = useState(false);

  // Computed values for the separate "mode" where this compute fetches the rule summary by itself
  const computedRuleSummary = useMemo(() => {
    if (fetchRuleSummary) {
      return internalRuleSummary;
    }
    return ruleSummary;
  }, [fetchRuleSummary, ruleSummary, internalRuleSummary]);

  const computedNumberOfExecutions = useMemo(() => {
    if (fetchRuleSummary) {
      return internalNumberOfExecutions;
    }
    return numberOfExecutions;
  }, [fetchRuleSummary, numberOfExecutions, internalNumberOfExecutions]);

  const computedIsLoadingRuleSummary = useMemo(() => {
    if (fetchRuleSummary) {
      return internalIsLoadingRuleSummary;
    }
    return isLoadingRuleSummary;
  }, [fetchRuleSummary, isLoadingRuleSummary, internalIsLoadingRuleSummary]);

  // Computed duration handlers
  const internalOnChangeDuration = useCallback(
    (duration: number) => {
      setInternalNumberOfExecutions(duration);
    },
    [setInternalNumberOfExecutions]
  );

  const computedOnChangeDuration = useMemo(() => {
    if (fetchRuleSummary) {
      return internalOnChangeDuration;
    }
    return onChangeDuration || internalOnChangeDuration;
  }, [fetchRuleSummary, onChangeDuration, internalOnChangeDuration]);

  const getRuleSummary = async () => {
    if (!fetchRuleSummary) {
      return;
    }
    setInternalIsLoadingRuleSummary(true);
    try {
      const loadedSummary = await loadRuleSummary(ruleId, computedNumberOfExecutions);
      setInternalRuleSummary(loadedSummary);
    } catch (e) {
      toasts.addDanger({
        title: i18n.translate(
          'xpack.triggersActionsUI.sections.ruleDetails.ruleExecutionSummaryAndChart.loadSummaryError',
          {
            defaultMessage: 'Unable to load rule summary: {message}',
            values: {
              message: e.message,
            },
          }
        ),
      });
    }
    setInternalIsLoadingRuleSummary(false);
  };

  useEffect(() => {
    getRuleSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId, computedNumberOfExecutions]);

  useEffect(() => {
    if (isInitialized.current) {
      getRuleSummary();
    }
    isInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const showDurationWarning = useMemo(() => {
    if (!computedRuleSummary) {
      return false;
    }
    return shouldShowDurationWarning(ruleType, computedRuleSummary.executionDuration.average);
  }, [ruleType, computedRuleSummary]);

  if (!computedRuleSummary) {
    return <CenterJustifiedSpinner />;
  }

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={1}>
        <EuiPanel
          data-test-subj="avgExecutionDurationPanel"
          color={showDurationWarning ? 'warning' : 'subdued'}
          hasBorder={false}
        >
          <EuiText size="s" color="text">
            {i18n.translate(
              'xpack.triggersActionsUI.sections.ruleDetails.alertsList.avgDurationDescription',
              {
                defaultMessage: `Average duration`,
              }
            )}
          </EuiText>
          <EuiFlexGroup gutterSize="xs" style={{ alignItems: 'center' }}>
            {showDurationWarning && (
              <EuiFlexItem grow={false} data-test-subj="ruleDurationWarning">
                <EuiIconTip
                  anchorClassName="ruleDurationWarningIcon"
                  css={ruleDurationWarningIconCss}
                  type="warning"
                  color="warning"
                  content={ruleTypeExcessDurationMessage}
                  aria-label={ruleTypeExcessDurationMessage}
                  position="top"
                  size="m"
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false} data-test-subj="ruleEventLogListAvgDuration">
              <EuiText size="m" color={euiTheme.colors.textParagraph}>
                <strong>
                  {formatMillisForDisplay(computedRuleSummary.executionDuration.average)}
                </strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={2}>
        <ExecutionDurationChart
          executionDuration={computedRuleSummary.executionDuration}
          numberOfExecutions={computedNumberOfExecutions}
          onChangeDuration={computedOnChangeDuration}
          isLoading={computedIsLoadingRuleSummary}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const RuleExecutionSummaryAndChartWithApi = withBulkRuleOperations(
  RuleExecutionSummaryAndChart
);
