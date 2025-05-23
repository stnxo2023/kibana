/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import { FtrProviderContext } from '../../ftr_provider_context';
import { MlCommonUI } from './common_ui';

const fixedFooterHeight = 72; // Size of EuiBottomBar more or less

export function MachineLearningDataVisualizerFileBasedProvider(
  { getService, getPageObjects }: FtrProviderContext,
  mlCommonUI: MlCommonUI
) {
  const es = getService('es');
  const log = getService('log');
  const retry = getService('retry');
  const testSubjects = getService('testSubjects');

  const PageObjects = getPageObjects(['common']);

  return {
    async selectFile(path: string, expectError: boolean = false) {
      log.debug(`Importing file '${path}' ...`);
      await PageObjects.common.setFileInputPath(path);

      await testSubjects.waitForDeleted('dataVisualizerPageFileLoading');

      if (expectError) {
        await testSubjects.existOrFail('~dataVisualizerFileUploadErrorCallout');
      } else {
        await testSubjects.missingOrFail('~dataVisualizerFileUploadErrorCallout');
        await testSubjects.existOrFail('dataVisualizerPageFileResults');
      }
    },

    async assertFileTitle(expectedTitle: string) {
      const actualTitle = await testSubjects.getVisibleText('dataVisualizerFileResultsTitle');
      expect(actualTitle).to.eql(
        expectedTitle,
        `Expected file title to be '${expectedTitle}' (got '${actualTitle}')`
      );
    },

    async assertFileContentPanelExists() {
      await testSubjects.existOrFail('dataVisualizerFileFileContentPanel');
    },

    async assertFileContentHighlightingSwitchExists(exist: boolean) {
      const tabs = await testSubjects.findAll('dataVisualizerFileContentsHighlightingSwitch');
      expect(tabs.length).to.eql(
        exist ? 1 : 0,
        `Expected file content highlighting switch to ${exist ? 'exist' : 'not exist'}, but found ${
          tabs.length
        }`
      );
    },

    async assertFileContentHighlighting(highlighted: boolean, numberOfFields: number) {
      const lines = await testSubjects.findAll('dataVisualizerHighlightedLine', 1000);
      const linesExist = lines.length > 0;
      expect(linesExist).to.eql(
        highlighted,
        `Expected file content highlighting to be '${highlighted ? 'enabled' : 'disabled'}'`
      );
      const expectedNumberOfFields = highlighted ? numberOfFields : 0;
      const foundFields = (await lines[0]?.findAllByTestSubject('dataVisualizerFieldBadge')) ?? [];

      expect(foundFields.length).to.eql(
        expectedNumberOfFields,
        `Expected ${expectedNumberOfFields} fields to be highlighted, but found ${foundFields.length}`
      );
    },

    async assertSummaryPanelExists() {
      await testSubjects.existOrFail('dataVisualizerFileSummaryPanel');
    },

    async assertFileStatsPanelExists() {
      await testSubjects.existOrFail('dataVisualizerFileFileStatsPanel');
    },

    async assertNumberOfFieldCards(number: number) {
      const cards = await testSubjects.findAll('mlPageFileDataVisFieldDataCard');
      expect(cards.length).to.eql(
        number,
        `expected ${number} field cards to exist, but found ${cards.length}`
      );
    },

    async assertImportButtonEnabled(expectedValue: boolean) {
      const isEnabled = await testSubjects.isEnabled('dataVisualizerFileOpenImportPageButton');
      expect(isEnabled).to.eql(
        expectedValue,
        `Expected "import" button to be '${expectedValue ? 'enabled' : 'disabled'}' (got '${
          isEnabled ? 'enabled' : 'disabled'
        }')`
      );
    },

    async navigateToFileImport() {
      await testSubjects.click('dataVisualizerFileOpenImportPageButton');
      await testSubjects.existOrFail('dataVisualizerPageFileImport');
    },

    async assertImportSettingsPanelExists() {
      await testSubjects.existOrFail('dataVisualizerFileImportSettingsPanel');
    },

    async assertIndexNameValue(expectedValue: string) {
      const actualIndexName = await testSubjects.getAttribute(
        'dataVisualizerFileIndexNameInput',
        'value'
      );
      expect(actualIndexName).to.eql(
        expectedValue,
        `Expected index name to be '${expectedValue}' (got '${actualIndexName}')`
      );
    },

    async setIndexName(indexName: string) {
      await mlCommonUI.setValueWithChecks('dataVisualizerFileIndexNameInput', indexName, {
        clearWithKeyboard: true,
      });
      await this.assertIndexNameValue(indexName);
    },

    async assertCreateIndexPatternCheckboxValue(expectedValue: boolean) {
      const isChecked = await testSubjects.isChecked('dataVisualizerFileCreateDataViewCheckbox');
      expect(isChecked).to.eql(
        expectedValue,
        `Expected create index pattern checkbox to be ${expectedValue ? 'checked' : 'unchecked'}`
      );
    },

    async setCreateIndexPatternCheckboxState(newState: boolean) {
      const isChecked = await testSubjects.isChecked('dataVisualizerFileCreateDataViewCheckbox');
      if (isChecked !== newState) {
        // this checkbox can't be clicked directly, instead click the corresponding label
        const panel = await testSubjects.find('dataVisualizerFileImportSettingsPanel');
        const label = await panel.findByCssSelector('[for="createDataView"]');
        await label.click();
      }
      await this.assertCreateIndexPatternCheckboxValue(newState);
    },

    async startImportAndWaitForProcessing() {
      await testSubjects.clickWhenNotDisabledWithoutRetry('dataVisualizerFileImportButton');
      await retry.tryForTime(60 * 1000, async () => {
        await testSubjects.existOrFail('dataVisualizerFileImportSuccessCallout');
      });
    },

    async assertIngestedDocCount(count: number) {
      const docCount = await mlCommonUI.getEuiDescriptionListDescriptionFromTitle(
        'dataVisualizerFileImportSuccessCallout',
        'Documents ingested'
      );
      expect(docCount).to.eql(
        count,
        `Expected Documents ingested count to be '${count}' (got '${docCount}')`
      );
    },

    async selectCreateFilebeatConfig() {
      await testSubjects.scrollIntoView('fileDataVisFilebeatConfigLink', {
        bottomOffset: fixedFooterHeight,
      });
      await testSubjects.click('fileDataVisFilebeatConfigLink');
      await testSubjects.existOrFail('fileDataVisFilebeatConfigPanel');
    },

    async closeCreateFilebeatConfig() {
      await testSubjects.click('fileBeatConfigFlyoutCloseButton');
      await testSubjects.missingOrFail('fileDataVisFilebeatConfigPanel');
    },

    async assertDocCountInIndex(index: string, expectedCount: number) {
      await retry.tryForTime(60 * 1000, async () => {
        const count = await this.getDocCountFromIndex(index);
        expect(count).to.eql(
          expectedCount,
          `Expected document count in index '${index}' to be '${expectedCount}' (got '${count}')`
        );
      });
    },

    async getDocCountFromIndex(index: string) {
      const resp = await es.search({
        index,
        size: 0,
        query: {
          match_all: {},
        },
      });
      // @ts-expect-error incorrect type definition
      return resp.hits.total?.value;
    },

    async assertFieldsFromIndex(index: string, fields: string[]) {
      await retry.tryForTime(60 * 1000, async () => {
        const sortedFields = fields.sort();
        const fieldCaps = await es.fieldCaps({
          index,
          fields: '*',
          filters: '-metadata',
          include_empty_fields: false,
        });
        const fieldsFromIndex = Object.keys(fieldCaps.fields).sort();
        expect(fieldsFromIndex).to.eql(
          sortedFields,
          `Expected fields to be ${sortedFields} (got ${fieldsFromIndex})`
        );
      });
    },
  };
}
