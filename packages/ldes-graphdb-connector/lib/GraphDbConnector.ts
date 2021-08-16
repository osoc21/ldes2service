import type { IConfigConnector, IWritableConnector, LdesShape } from '@ldes/types';

const { EnapsoGraphDBClient } = require('@innotrade/enapso-graphdb-client');

const DEFAULT_PREFIXES = [
  EnapsoGraphDBClient.PREFIX_OWL,
  EnapsoGraphDBClient.PREFIX_RDF,
  EnapsoGraphDBClient.PREFIX_RDFS,
  EnapsoGraphDBClient.PREFIX_XSD,
  EnapsoGraphDBClient.PREFIX_PROTONS,
];

export interface IConfigGraphDbConnector extends IConfigConnector {
  baseUrl: string;
  repository: string;
  username?: string;
  password?: string;
}

const defaultConfig: IConfigGraphDbConnector = {
  amountOfVersions: 0,
  baseUrl: 'http://localhost:7200',
  repository: 'Test',
};

export class GraphDbConnector implements IWritableConnector {
  private readonly config: IConfigGraphDbConnector;
  private readonly shape?: LdesShape;
  private readonly members: any[];
  private endpoint: any;
  private readonly id: string;
  private readonly columnToFieldPath: Map<string, string> = new Map();

  public constructor(config: IConfigConnector, shape: LdesShape, id: string) {
    this.config = { ...defaultConfig, ...config };
    this.id = id;
    this.shape = shape;
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: any): Promise<void> {
    const JSONmember = JSON.parse(member);

    let query = Object.keys(JSONmember)
      .filter(el => !['@id', '@type'].includes(el))
      .reduce(
        (acc, field) => `${acc};
        <${field}> ${this.getField(JSONmember[field])} `,
        `INSERT DATA { <${JSONmember['@id']}> a <${JSONmember['@type']}> `
      );

    query += '. }';

    // Console.debug('SPARQL Query:', query);
    await this.endpoint.update(query);
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   */
  public async provision(): Promise<void> {
    this.endpoint = new EnapsoGraphDBClient.Endpoint({
      baseURL: this.config.baseUrl,
      repository: this.config.repository,
      prefixes: DEFAULT_PREFIXES,
    });

    if (this.config.username) {
      await this.endpoint.login(this.config.username, this.config.username);
    }
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    //
  }

  private getField(property: any): string {
    if (property?.['@id']) {
      return `<${property['@id']}>`;
    }

    return `"${property?.['@value'] ?? property ?? null}"`;
  }
}
