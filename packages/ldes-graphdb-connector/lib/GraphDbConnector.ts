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

  private async versioning(member: any): Promise<void> {
    if (!this.config.versions) {
      return;
    }

    const versionId = this.config.versions.identifier;
    const sorterSlug = this.config.versions.sorter;
    const version = this.rdfValueHandler(member[this.config.versions.identifier]);

    const request = await this.endpoint.query(
      `select ?id where { 
        ?id <${versionId}> ${version} .
        ?id <${sorterSlug}> ?sort .
      } order by asc(?sort)`
    );

    const numberToDelete = request.results.bindings.length - this.config.versions.amount;

    if (numberToDelete > 0) {
      const idsToKeep = request.results.bindings
        .slice(numberToDelete)
        .map((value: any) => `"${value.id.value}"`)
        .join(',');

      const idsToRemove = request.results.bindings
        .slice(0, numberToDelete)
        .map((value: any) => `<${value.id.value}>`)
        .join(',');

      console.debug('To Delete:', idsToRemove);
      console.debug('To keep:', idsToKeep);

      console.debug(`DELETE {
           ?s ?p ?o .
        }
        WHERE { 
          ?s ?p ?o .
          filter( ?s in (${idsToRemove}))
        }`);
      await this.endpoint.update(
        `DELETE {
           ?s ?p ?o .
        }
        WHERE { 
          ?s ?p ?o .
          filter( ?s in (${idsToRemove}))
        }`
      );
    }
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
        (acc, field) => `${acc} ${this.getField(field, JSONmember[field])} `,
        `INSERT DATA { <${JSONmember['@id']}> a <${JSONmember['@type']}> `
      );

    query += '. }';

    // Console.debug('SPARQL Query:', query);
    await this.endpoint.update(query);

    if (this.config.versions) {
      await this.versioning(JSONmember);
    }
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

  private rdfValueHandler(property: any): string {
    if (property?.['@id']) {
      return `<${property['@id']}>`;
    }
    if (property?.['@type']) {
      return `"${property['@value']}"^^<${property['@type']}>`;
    }
    if (property?.['@language']) {
      return `"${property['@value']}"@${property['@language']}`;
    }
    return `"${property?.['@value'] ?? property ?? ''}"`;
  }

  private getField(field: string, property: any): string {
    const base = `; <${field}> `;
    if (Array.isArray(property)) {
      return property.map((el: any) => base + this.rdfValueHandler(el)).join(' ');
    }

    return this.rdfValueHandler(property) ? base + this.rdfValueHandler(property) : '';
  }
}
