/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import * as i18n from './translations';

export const UnknownMigration: React.FC = React.memo(() => {
  return (
    <EuiFlexGroup
      data-test-subj="siemMigrationsUnknown"
      alignItems="center"
      gutterSize="s"
      responsive={false}
      direction="column"
      wrap={true}
    >
      <EuiFlexItem grow={false}>
        <EuiEmptyPrompt
          title={<h2>{i18n.UNKNOWN_MIGRATION}</h2>}
          titleSize="s"
          body={i18n.UNKNOWN_MIGRATION_BODY}
          data-test-subj="unknownMigration"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
});
UnknownMigration.displayName = 'UnknownMigration';
