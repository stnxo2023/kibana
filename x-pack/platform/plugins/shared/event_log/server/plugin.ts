/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin as CorePlugin,
  PluginInitializerContext,
  IClusterClient,
} from '@kbn/core/server';
import type { SpacesPluginStart } from '@kbn/spaces-plugin/server';
import type { ServerlessPluginSetup } from '@kbn/serverless/server';

import type {
  IEventLogConfig,
  IEventLogService,
  IEventLogger,
  IEventLogClientService,
} from './types';
import { EventLogService } from './event_log_service';
import type { EsContext } from './es';
import { createEsContext } from './es';
import { EventLogClientService } from './event_log_start_service';
import { SavedObjectProviderRegistry } from './saved_object_provider_registry';

export type PluginClusterClient = Pick<IClusterClient, 'asInternalUser'>;

const PROVIDER = 'eventLog';

const ACTIONS = {
  starting: 'starting',
  stopping: 'stopping',
};

interface PluginSetupDeps {
  serverless?: ServerlessPluginSetup;
}

interface PluginStartDeps {
  spaces?: SpacesPluginStart;
}

export class Plugin implements CorePlugin<IEventLogService, IEventLogClientService> {
  private readonly config: IEventLogConfig;
  private systemLogger: Logger;
  private eventLogService?: EventLogService;
  private esContext?: EsContext;
  private eventLogger?: IEventLogger;
  private eventLogClientService?: EventLogClientService;
  private savedObjectProviderRegistry: SavedObjectProviderRegistry;
  private kibanaVersion: PluginInitializerContext['env']['packageInfo']['version'];

  constructor(private readonly context: PluginInitializerContext) {
    this.systemLogger = this.context.logger.get();
    this.config = this.context.config.get<IEventLogConfig>();
    this.savedObjectProviderRegistry = new SavedObjectProviderRegistry();
    this.kibanaVersion = this.context.env.packageInfo.version;
  }

  setup(core: CoreSetup, plugins: PluginSetupDeps): IEventLogService {
    const kibanaIndex = core.savedObjects.getDefaultIndex();
    this.systemLogger.debug('setting up plugin');

    this.esContext = createEsContext({
      logger: this.systemLogger,
      indexNameRoot: kibanaIndex,
      elasticsearchClientPromise: core
        .getStartServices()
        .then(([{ elasticsearch }]) => elasticsearch.client.asInternalUser),
      // Only non-serverless deployments may have assets that need to be converted
      shouldSetExistingAssetsToHidden: !plugins.serverless,
    });

    this.eventLogService = new EventLogService({
      config: this.config,
      esContext: this.esContext,
      systemLogger: this.systemLogger,
      kibanaUUID: this.context.env.instanceUuid,
      savedObjectProviderRegistry: this.savedObjectProviderRegistry,
      kibanaVersion: this.kibanaVersion,
    });

    this.eventLogService.registerProviderActions(PROVIDER, Object.values(ACTIONS));

    this.eventLogger = this.eventLogService.getLogger({
      event: { provider: PROVIDER },
    });

    return this.eventLogService;
  }

  start(core: CoreStart, { spaces }: PluginStartDeps): IEventLogClientService {
    this.systemLogger.debug('starting plugin');

    if (!this.esContext) throw new Error('esContext not initialized');
    if (!this.eventLogger) throw new Error('eventLogger not initialized');
    if (!this.eventLogService) throw new Error('eventLogService not initialized');

    // launches initialization async
    if (this.eventLogService.isIndexingEntries()) {
      this.esContext.initialize();
    }

    // Log an error if initialiization didn't succeed.
    // Note that waitTillReady() is used elsewhere as a gate to having the
    // event log initialization complete - successfully or not.  Other uses
    // of this do not bother logging when success is false, as they are in
    // paths that would cause log spamming.  So we do it once, here, just to
    // ensure an unsucccess initialization is logged when it occurs.
    this.esContext
      .waitTillReady()
      .then((success) => {
        if (!success) {
          this.systemLogger.error(`initialization failed, events will not be indexed`);
        }
      })
      .catch((error) => {
        this.systemLogger.error(
          `initialization failed with error: ${error}. Events will not be indexed`
        );
      });

    // will log the event after initialization
    this.eventLogger.logEvent({
      event: { action: ACTIONS.starting },
      message: 'eventLog starting',
    });

    this.savedObjectProviderRegistry.registerDefaultProvider((request) => {
      const client = core.savedObjects.getScopedClient(request);
      return client.bulkGet.bind(client);
    });

    this.eventLogClientService = new EventLogClientService({
      esContext: this.esContext,
      savedObjectProviderRegistry: this.savedObjectProviderRegistry,
      spacesService: spaces?.spacesService,
    });
    return this.eventLogClientService;
  }

  async stop(): Promise<void> {
    this.systemLogger.debug('stopping plugin');

    if (!this.eventLogger) throw new Error('eventLogger not initialized');

    // note that it's unlikely this event would ever be written,
    // when Kibana is actuaelly stopping, as it's written asynchronously
    this.eventLogger.logEvent({
      event: { action: ACTIONS.stopping },
      message: 'eventLog stopping',
    });

    this.systemLogger.debug('shutdown: waiting to finish');
    await this.esContext?.shutdown();
    this.systemLogger.debug('shutdown: finished');
  }
}
