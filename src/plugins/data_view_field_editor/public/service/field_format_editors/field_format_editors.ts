/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FieldFormatEditorFactory } from '../../components/field_format_editor';
import { FormatEditorServiceSetup, FormatEditorServiceStart } from '../format_editor_service';

export class FieldFormatEditors {
  private editors: FieldFormatEditorFactory[] = [];

  public setup(
    defaultFieldEditors: FieldFormatEditorFactory[] = []
  ): FormatEditorServiceSetup['fieldFormatEditors'] {
    this.editors = defaultFieldEditors;

    return {
      register: (editor: FieldFormatEditorFactory) => {
        this.editors.push(editor);
      },
    };
  }

  public start(): FormatEditorServiceStart['fieldFormatEditors'] {
    return {
      getAll: () => [...this.editors],
      getById: <P>(id: string) => {
        return this.editors.find((editor) => editor.formatId === id) as
          | FieldFormatEditorFactory<P>
          | undefined;
      },
    };
  }
}
