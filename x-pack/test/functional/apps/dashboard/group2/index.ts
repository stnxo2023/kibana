/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ loadTestFile }: FtrProviderContext) {
  describe('dashboard', function () {
    loadTestFile(require.resolve('./sync_colors'));
    loadTestFile(require.resolve('./_async_dashboard'));
    loadTestFile(require.resolve('./dashboard_lens_by_value'));
    loadTestFile(require.resolve('./dashboard_maps_by_value'));
    loadTestFile(require.resolve('./dashboard_search_by_value'));
    loadTestFile(require.resolve('./dashboard_panel_listing'));
    loadTestFile(require.resolve('./panel_titles'));
    loadTestFile(require.resolve('./panel_time_range'));

    loadTestFile(require.resolve('./migration_smoke_tests/lens_migration_smoke_test'));
    loadTestFile(require.resolve('./migration_smoke_tests/controls_migration_smoke_test'));
    loadTestFile(require.resolve('./migration_smoke_tests/visualize_migration_smoke_test'));
    loadTestFile(require.resolve('./migration_smoke_tests/tsvb_migration_smoke_test'));
  });
}
