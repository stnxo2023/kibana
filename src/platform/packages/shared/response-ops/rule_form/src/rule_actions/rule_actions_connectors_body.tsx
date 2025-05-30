/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  EuiButton,
  EuiCard,
  EuiEmptyPrompt,
  EuiFacetButton,
  EuiFacetGroup,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiPopover,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
  EuiToolTip,
  useEuiTheme,
  EuiSelectable,
  EuiSelectableProps,
  useCurrentEuiBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import {
  ActionConnector,
  type ActionTypeModel,
  checkActionFormActionTypeEnabled,
} from '@kbn/alerts-ui-shared';
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RuleFormParamsErrors } from '../common/types';
import { DEFAULT_FREQUENCY } from '../constants';
import { useRuleFormDispatch, useRuleFormState } from '../hooks';
import {
  ACTION_TYPE_MODAL_EMPTY_TEXT,
  ACTION_TYPE_MODAL_EMPTY_TITLE,
  ACTION_TYPE_MODAL_FILTER_ALL,
  ACTION_TYPE_MODAL_FILTER_LIST_TITLE,
  MODAL_SEARCH_CLEAR_FILTERS_TEXT,
  MODAL_SEARCH_PLACEHOLDER,
} from '../translations';
import { getDefaultParams } from '../utils';

type ConnectorsMap = Record<string, { actionTypeId: string; name: string; total: number }>;

export interface RuleActionsConnectorsBodyProps {
  onSelectConnector: (connector?: ActionConnector) => void;
  responsiveOverflow?: 'auto' | 'hidden';
}

export const RuleActionsConnectorsBody = ({
  onSelectConnector,
  responsiveOverflow = 'auto',
}: RuleActionsConnectorsBodyProps) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>('all');
  const [isConenctorFilterPopoverOpen, setIsConenctorFilterPopoverOpen] = useState<boolean>(false);

  const { euiTheme } = useEuiTheme();

  const currentBreakpoint = useCurrentEuiBreakpoint() ?? 'm';

  const containerCss = css`
    .showForContainer--s,
    showForContainer--xs {
      display: none;
    }

    @container (max-width: 767px) and (min-width: 575px) {
      .hideForContainer--s {
        display: none;
      }

      .showForContainer--s {
        display: initial !important;
      }
    }
    @container (max-width: 574px) {
      .hideForContainer--xs {
        display: none;
      }

      .showForContainer--xs {
        display: initial !important;
      }
    }
  `;

  const {
    plugins: { actionTypeRegistry },
    formData: { actions },
    connectors,
    connectorTypes,
    selectedRuleType,
  } = useRuleFormState();

  const dispatch = useRuleFormDispatch();

  const onSelectConnectorInternal = useCallback(
    async (connector: ActionConnector) => {
      const { id, actionTypeId } = connector;
      const uuid = uuidv4();
      const group = selectedRuleType.defaultActionGroupId;
      const actionTypeModel = actionTypeRegistry.get(actionTypeId);

      const params =
        getDefaultParams({
          group,
          ruleType: selectedRuleType,
          actionTypeModel,
        }) || {};

      dispatch({
        type: 'addAction',
        payload: {
          id,
          actionTypeId,
          uuid,
          params,
          group,
          frequency: DEFAULT_FREQUENCY,
        },
      });

      const res: { errors: RuleFormParamsErrors } = await actionTypeRegistry
        .get(actionTypeId)
        ?.validateParams(params);

      dispatch({
        type: 'setActionParamsError',
        payload: {
          uuid,
          errors: res.errors,
        },
      });

      // Send connector to onSelectConnector mainly for testing purposes, dispatch handles form data updates
      onSelectConnector(connector);
    },
    [dispatch, onSelectConnector, selectedRuleType, actionTypeRegistry]
  );

  const preconfiguredConnectors = useMemo(() => {
    return connectors.filter((connector) => connector.isPreconfigured);
  }, [connectors]);

  const availableConnectors = useMemo(() => {
    return connectors.filter(({ actionTypeId }) => {
      const actionType = connectorTypes.find(({ id }) => id === actionTypeId);

      if (!actionTypeRegistry.has(actionTypeId)) {
        return false;
      }

      const actionTypeModel = actionTypeRegistry.get(actionTypeId);

      if (!actionType) {
        return false;
      }

      if (!actionTypeModel?.actionParamsFields) {
        return false;
      }

      const checkEnabledResult = checkActionFormActionTypeEnabled(
        actionType,
        preconfiguredConnectors
      );

      if (!actionType.enabledInConfig && !checkEnabledResult.isEnabled) {
        return false;
      }

      return true;
    });
  }, [connectors, connectorTypes, preconfiguredConnectors, actionTypeRegistry]);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const onConnectorOptionSelect = useCallback(
    (id: string) => () => {
      setSelectedConnectorType((prev) => {
        if (prev === id) {
          return 'all';
        }
        return id;
      });
    },
    []
  );

  const onClearFilters = useCallback(() => {
    setSearchValue('');
    setSelectedConnectorType('all');
  }, []);

  const connectorsMap: ConnectorsMap | null = useMemo(() => {
    return availableConnectors.reduce<ConnectorsMap>((result, { actionTypeId }) => {
      const actionTypeModel = actionTypeRegistry.get(actionTypeId);
      const subtype = actionTypeModel.subtype;

      const shownActionTypeId = actionTypeModel.hideInUi
        ? subtype?.filter((type) => type.id !== actionTypeId)[0].id
        : undefined;

      const currentActionTypeId = shownActionTypeId ? shownActionTypeId : actionTypeId;

      if (result[currentActionTypeId]) {
        result[currentActionTypeId].total += 1;
      } else {
        result[currentActionTypeId] = {
          actionTypeId: currentActionTypeId,
          total: 1,
          name: connectorTypes.find(({ id }) => id === currentActionTypeId)?.name || '',
        };
      }

      return result;
    }, {});
  }, [availableConnectors, connectorTypes, actionTypeRegistry]);

  const filteredConnectors = useMemo(() => {
    return availableConnectors
      .filter(({ actionTypeId }) => {
        const subtype = actionTypeRegistry.get(actionTypeId).subtype?.map((type) => type.id);

        if (selectedConnectorType === 'all' || selectedConnectorType === '') {
          return true;
        }

        if (subtype?.includes(selectedConnectorType)) {
          return subtype.includes(actionTypeId);
        }

        return selectedConnectorType === actionTypeId;
      })
      .filter(({ actionTypeId, name }) => {
        const trimmedSearchValue = searchValue.trim().toLocaleLowerCase();
        if (trimmedSearchValue === '') {
          return true;
        }
        const actionTypeModel = actionTypeRegistry.get(actionTypeId);
        const actionType = connectorTypes.find(({ id }) => id === actionTypeId);
        const textSearchTargets = [
          name.toLocaleLowerCase(),
          actionTypeModel.selectMessage?.toLocaleLowerCase(),
          actionTypeModel.actionTypeTitle?.toLocaleLowerCase(),
          actionType?.name?.toLocaleLowerCase(),
        ];
        return textSearchTargets.some((text) => text?.includes(trimmedSearchValue));
      });
  }, [availableConnectors, selectedConnectorType, searchValue, connectorTypes, actionTypeRegistry]);

  const connectorFacetButtons = useMemo(() => {
    return (
      <EuiFacetGroup
        data-test-subj="ruleActionsConnectorsModalFilterButtonGroup"
        style={{ overflow: 'auto' }}
      >
        <EuiFacetButton
          data-test-subj="ruleActionsConnectorsModalFilterButton"
          key="all"
          quantity={availableConnectors.length}
          isSelected={selectedConnectorType === 'all'}
          onClick={onConnectorOptionSelect('all')}
        >
          {ACTION_TYPE_MODAL_FILTER_ALL}
        </EuiFacetButton>
        {Object.values(connectorsMap)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ actionTypeId, name, total }) => {
            return (
              <EuiFacetButton
                data-test-subj="ruleActionsConnectorsModalFilterButton"
                key={actionTypeId}
                quantity={total}
                isSelected={selectedConnectorType === actionTypeId}
                onClick={onConnectorOptionSelect(actionTypeId)}
              >
                {name}
              </EuiFacetButton>
            );
          })}
      </EuiFacetGroup>
    );
  }, [availableConnectors, connectorsMap, selectedConnectorType, onConnectorOptionSelect]);

  const toggleFilterPopover = useCallback(() => {
    setIsConenctorFilterPopoverOpen((prev) => !prev);
  }, []);
  const closeFilterPopover = useCallback(() => {
    setIsConenctorFilterPopoverOpen(false);
  }, []);
  const connectorFilterButton = useMemo(() => {
    const button = (
      <EuiFilterButton
        iconType="arrowDown"
        badgeColor="accent"
        hasActiveFilters={selectedConnectorType !== 'all'}
        numActiveFilters={selectedConnectorType !== 'all' ? 1 : undefined}
        onClick={toggleFilterPopover}
        isSelected={isConenctorFilterPopoverOpen}
      >
        {ACTION_TYPE_MODAL_FILTER_LIST_TITLE}
      </EuiFilterButton>
    );

    const options: EuiSelectableProps['options'] = Object.values(connectorsMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ actionTypeId, name }) => ({
        label: name,
        checked: selectedConnectorType === actionTypeId ? 'on' : undefined,
        onClick: onConnectorOptionSelect(actionTypeId),
      }));

    return (
      <EuiFilterGroup style={{ width: '100%' }}>
        <EuiPopover
          button={button}
          closePopover={closeFilterPopover}
          isOpen={isConenctorFilterPopoverOpen}
          panelPaddingSize="none"
        >
          <EuiSelectable singleSelection options={options}>
            {(list) => <div style={{ width: 400 }}>{list}</div>}
          </EuiSelectable>
        </EuiPopover>
      </EuiFilterGroup>
    );
  }, [
    closeFilterPopover,
    connectorsMap,
    isConenctorFilterPopoverOpen,
    onConnectorOptionSelect,
    toggleFilterPopover,
    selectedConnectorType,
  ]);

  const connectorCards = useMemo(() => {
    if (!filteredConnectors.length) {
      return (
        <EuiEmptyPrompt
          data-test-subj="ruleActionsConnectorsModalEmpty"
          color="subdued"
          iconType="search"
          title={<h2>{ACTION_TYPE_MODAL_EMPTY_TITLE}</h2>}
          body={
            <EuiText>
              <p>{ACTION_TYPE_MODAL_EMPTY_TEXT}</p>
            </EuiText>
          }
          actions={
            <EuiButton
              data-test-subj="ruleActionsConnectorsModalClearFiltersButton"
              size="s"
              color="primary"
              fill
              onClick={onClearFilters}
            >
              {MODAL_SEARCH_CLEAR_FILTERS_TEXT}
            </EuiButton>
          }
        />
      );
    }
    return (
      <EuiFlexGroup direction="column">
        {filteredConnectors.map((connector) => {
          const { id, actionTypeId, name } = connector;
          let actionTypeModel: ActionTypeModel;
          try {
            actionTypeModel = actionTypeRegistry.get(actionTypeId);
            if (!actionTypeModel) return null;
          } catch (e) {
            return null;
          }
          const actionType = connectorTypes.find((item) => item.id === actionTypeId);

          if (!actionType) {
            return null;
          }

          const checkEnabledResult = checkActionFormActionTypeEnabled(
            actionType,
            preconfiguredConnectors
          );

          const isSystemActionsSelected = Boolean(
            actionTypeModel.isSystemActionType &&
              actions.find((action) => action.actionTypeId === actionTypeModel.id)
          );

          const isDisabled = !checkEnabledResult.isEnabled || isSystemActionsSelected;

          const connectorCard = (
            <EuiCard
              data-test-subj="ruleActionsConnectorsModalCard"
              data-action-type-id={actionTypeId}
              hasBorder
              isDisabled={isDisabled}
              titleSize="xs"
              layout="horizontal"
              icon={
                <div style={{ marginInlineEnd: `16px` }}>
                  <Suspense fallback={<EuiLoadingSpinner />}>
                    <EuiIcon size="l" type={actionTypeModel.iconClass} />
                  </Suspense>
                </div>
              }
              title={name}
              description={
                <>
                  <EuiText size="xs">{actionTypeModel.selectMessage}</EuiText>
                  <EuiSpacer size="s" />
                  <EuiText color="subdued" size="xs" style={{ textTransform: 'uppercase' }}>
                    <strong>{actionType?.name}</strong>
                  </EuiText>
                </>
              }
              onClick={() => onSelectConnectorInternal(connector)}
            />
          );

          return (
            <EuiFlexItem key={id} grow={false}>
              {checkEnabledResult.isEnabled && connectorCard}
              {!checkEnabledResult.isEnabled && (
                <EuiToolTip position="top" content={checkEnabledResult.message}>
                  {connectorCard}
                </EuiToolTip>
              )}
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    );
  }, [
    actions,
    preconfiguredConnectors,
    filteredConnectors,
    actionTypeRegistry,
    connectorTypes,
    onSelectConnectorInternal,
    onClearFilters,
  ]);

  return (
    <>
      <EuiFlexGroup
        direction="column"
        style={{ overflow: responsiveOverflow, height: '100%' }}
        css={containerCss}
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column">
            <EuiFlexGroup gutterSize="s" wrap={false} responsive={false}>
              <EuiFlexItem grow={3}>
                <EuiFieldSearch
                  fullWidth={
                    /* TODO Determine this using @container breakpoints once we have a better helper function for
                     * determining the size of a CSS @container. This works in practice because when the action connector
                     * UI is displayed in a modal, a screen breakpoint of 'm' is equivalent to a container breakpoint of 's',
                     * but we should replace this with a more robust solution in the future. This may not be very easy until
                     * https://github.com/w3c/csswg-drafts/issues/6205 is resolved, but we could theoretically hack something
                     * together using showForContainer classes and React refs.
                     */
                    ['m', 's', 'xs'].includes(currentBreakpoint)
                  }
                  data-test-subj="ruleActionsConnectorsModalSearch"
                  placeholder={MODAL_SEARCH_PLACEHOLDER}
                  value={searchValue}
                  onChange={onSearchChange}
                />
              </EuiFlexItem>
              <EuiFlexItem className="showForContainer--s showForContainer--xs">
                {connectorFilterButton}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule margin="none" />
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem style={{ overflow: responsiveOverflow }}>
          <EuiFlexGroup style={{ overflow: responsiveOverflow }}>
            <EuiFlexItem className="hideForContainer--s hideForContainer--xs" grow={1}>
              {connectorFacetButtons}
            </EuiFlexItem>
            <EuiFlexItem
              grow={3}
              style={{
                overflow: 'auto',
                width: '100%',
                padding: `${euiTheme.size.base} ${euiTheme.size.base} ${euiTheme.size.xl}`,
              }}
            >
              {connectorCards}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
