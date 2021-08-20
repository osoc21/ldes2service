import { URL } from 'url';
import type {
  IState,
  IWritableConnector,
  IConnectorConfig,
  LdesObject,
  LdesObjects,
  ConnectorConfigs,
  IStateConfig,
} from '@ldes/types';
import { newEngine } from '@treecg/actor-init-ldes-client';
import type { IEventStreamArgs } from '@treecg/actor-init-ldes-client/lib/EventStream';

interface IStateDefinition {
  class: any;
  settings: IStateConfig;
}

/**
 * An Orchestrator will handle the synchronization of the Linked Data Event Stream.
 */
export class Orchestrator {
  private readonly stateDefinition: IStateDefinition;
  private readonly ldesObjects: LdesObjects;
  private readonly ldesConnectors: Map<LdesObject, IWritableConnector[]> = new Map();
  private readonly connectorsConfig: ConnectorConfigs;
  private readonly streamOptions: IEventStreamArgs;

  public constructor(
    stateDefinition: IStateDefinition,
    ldesObjects: LdesObjects,
    connectorsConfig: ConnectorConfigs,
    streamOptions: IEventStreamArgs
  ) {
    this.stateDefinition = stateDefinition;
    this.ldesObjects = ldesObjects;
    this.connectorsConfig = connectorsConfig;
    this.streamOptions = streamOptions;
  }

  /**
   * Start listening to the events and pipe them to the connectors
   */
  public async run(): Promise<void[]> {
    console.debug('START RUN');

    const runs = Array.from(this.ldesConnectors.keys()).map(ldesObject => {
      const connectors = this.ldesConnectors.get(ldesObject);

      if (!connectors) {
        return;
      }

      return new Promise<void>((resolve, reject) => {
        ldesObject.stream
          .on('metadata', data => this.processMetadata(ldesObject, data.url))
          .on('readable', async () => {
            await this.processData(ldesObject, connectors);
          })
          .on('error', (error: any) => reject(error));

        ldesObject.stream.on('end', () => resolve());
      });
    });

    return await Promise.all(runs);
  }

  private async processMetadata(ldesObject: LdesObject, url: string): Promise<void> {
    await ldesObject.state.setLatestPage(new URL(url));
  }

  private async createStreams(): Promise<void> {
    const promises = Object.values(this.ldesObjects).map(async ldesObject => {
      const id = `${this.stateDefinition.settings.id}_${ldesObject.url}`;
      const state: IState = new this.stateDefinition.class({ ...this.stateDefinition.settings, id });

      await state.provision();

      const latestPage = (await state.getLatestPage())?.href ?? ldesObject.url;
      const processedPages = (await state.getProcessedPages()).map(url => url.href);

      console.log(latestPage, processedPages);

      const stream = newEngine().createReadStream(latestPage, this.streamOptions);

      stream.ignorePages(processedPages);

      this.ldesObjects[ldesObject.url].state = state;
      this.ldesObjects[ldesObject.url].stream = stream;
    });

    await Promise.all(promises);
  }

  public async provision(): Promise<void> {
    const promises: Promise<void>[] = [];
    await this.createStreams();

    Object.values(this.ldesObjects).forEach(ldesObject => {
      const ldesConnectors: IWritableConnector[] = Object.values(this.connectorsConfig).map(
        (con: IConnectorConfig) => {
          const config = con.settings || {};
          const Connector = require(con.type || '@ldes/ldes-dummy-connector');

          const connectorName = Object.keys(Connector).find(key => key.endsWith('Connector'));

          if (!connectorName) {
            throw new Error(`The connector ${con.type} couldn't be loaded correctly!`);
          }

          const connector = new Connector[connectorName](config, ldesObject.shape, ldesObject.name);

          promises.push(connector.provision());

          return connector;
        }
      );

      this.ldesConnectors.set(ldesObject, ldesConnectors);
    });

    await Promise.all(promises);

    console.debug('END PROVISION');
  }

  /**
   * Reset the state
   */
  public async reset(): Promise<void> {
    const promises = Object.values(this.ldesObjects).map(obj => obj.state.reset());

    await Promise.all(promises);
  }

  protected async processData(ldesObject: LdesObject, connectors: IWritableConnector[]): Promise<void> {
    let member: string = ldesObject.stream.read();

    while (member) {
      const copiedMember = member;

      await Promise.all(connectors.map(con => con.writeVersion(copiedMember)));

      member = ldesObject.stream.read();
    }
  }
}
