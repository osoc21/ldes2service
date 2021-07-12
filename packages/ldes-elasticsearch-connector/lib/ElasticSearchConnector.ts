import type { IWritableConnector, IConfigConnector } from '@ldes/types';
import { Client } from '@elastic/elasticsearch';

export class ElasticSearchConnector implements IWritableConnector {
  private readonly config: IConfigConnector;
  private client: Client;

  public constructor(config: IConfigConnector) {
    this.config = config;
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: any): Promise<void> {
    const JSONmember = JSON.parse(member);

    // This needs to become more generic:
    // @see https://github.com/osoc21/ldes2service/issues/20
    const isVersionOf = JSONmember['http://purl.org/dc/terms/isVersionOf']['@id'];
    const memberObject = {
      id: JSONmember['@id'],
      type: JSONmember['@type'],
      generated_at: new Date(JSONmember['http://www.w3.org/ns/prov#generatedAtTime']),
      is_version_of: isVersionOf,
      data: member,
    };

    this.client.index({ index: 'events', body: memberObject });
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins.
   */
  public async provision(): Promise<void> {
    this.client = new Client({
      // TODO remove hardcoded variable
      node: 'http://backend:9200',
    });
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    //
  }
}
