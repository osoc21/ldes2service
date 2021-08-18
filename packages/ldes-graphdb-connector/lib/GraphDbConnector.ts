import type { IConfigConnector, IWritableConnector, LdesShape } from '@ldes/types';
import { JsonLdParser } from 'jsonld-streaming-parser';
import { DataFactory } from 'rdf-data-factory';
import type { Update } from 'sparqljs';
import { Generator as SparqlGenerator } from 'sparqljs';

const { EnapsoGraphDBClient } = require('@innotrade/enapso-graphdb-client');

const RETRY_COUNT = 3;

const factory = new DataFactory();

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
  graphPrefix: string;
  username?: string;
  password?: string;
}

const defaultConfig: IConfigGraphDbConnector = {
  graphPrefix: 'http://localhost/graph/',
  baseUrl: 'http://localhost:7200',
  repository: 'Test',
};

export class GraphDbConnector implements IWritableConnector {
  private readonly config: IConfigGraphDbConnector;
  private readonly shape?: LdesShape;
  private queue = [];
  private versionConstraintTimeout: NodeJS.Timer;
  private flushTimeout: NodeJS.Timer;
  private endpoint: any;
  private readonly id: string;
  private readonly graph: string;
  private versionConstraintInProgress = false;

  public constructor(config: IConfigConnector, shape: LdesShape, id: string) {
    this.config = { ...defaultConfig, ...config };
    this.id = id;
    this.shape = shape;
    this.graph = this.config.graphPrefix + this.id;
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }
    const quads = this.queue.slice();
    this.queue = [];

    console.debug('Sending', quads.length, 'quads');

    const generator = new SparqlGenerator();
    const query: Update = {
      type: 'update',
      prefixes: {},
      updates: [
        {
          updateType: 'insert',
          insert: [
            {
              type: 'graph',
              triples: quads,
              name: factory.namedNode(this.graph),
            },
          ],
        },
      ],
    };

    const stringQuery = generator.stringify(query);

    await this.endpoint.update(stringQuery);
  }

  public async addToQueue(quads: any): Promise<void> {
    this.queue = this.queue.concat(quads);
  }

  private async _removeExcedentVersions(element: string): Promise<void> {
    if (!this.config.versions) {
      return;
    }
    const versionId = this.config.versions.identifier;
    const sorterSlug = this.config.versions.sorter;

    let request;
    for (let count = 0; count < RETRY_COUNT; count++) {
      try {
        request = await this.endpoint.query(
          `select ?id from <${this.graph}> where
            { ?id <${versionId}> <${element}> . ?id <${sorterSlug}> ?sort . } order by asc(?sort)`
        );
        break;
      } catch (error: unknown) {
        console.error('TRIM VERSIONS:', error);
      }
    }

    const numberToDelete = request.results.bindings.length - this.config.versions.amount;

    if (numberToDelete > 0) {
      const idsToRemove = request.results.bindings
        .slice(0, numberToDelete)
        .map((value: any) => `<${value.id.value}>`)
        .join(',');

      for (let count = 0; count < RETRY_COUNT; count++) {
        try {
          await this.endpoint.update(
            `WITH <${this.graph}> DELETE { ?s ?p ?o . } WHERE { ?s ?p ?o . filter( ?s in (${idsToRemove})) }`
          );
          break;
        } catch (error: unknown) {
          console.error('TRIM VERSIONS:', error);
        }
      }
    }
  }

  private async versionConstraint(): Promise<void> {
    if (!this.config.versions || this.versionConstraintInProgress) {
      return;
    }
    this.versionConstraintInProgress = true;

    const limit = this.config.versions.amount;
    const versionOf = this.config.versions.identifier;

    const request = await this.endpoint.query(
      `select ?version from <${this.graph}> 
        { ?s <${versionOf}> ?version; } group by (?version) having (count(?s) > ${limit})`
    );

    const numberToDelete = request.results.bindings.length;

    console.log(numberToDelete, 'elements have too many versions');

    await Promise.all(
      request.results.bindings.map((el: any) => this._removeExcedentVersions(el.version.value))
    );
    this.versionConstraintInProgress = false;
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: any): Promise<void> {
    const chunks: any[] = [];
    const parser = new JsonLdParser();
    parser
      .on('data', chunk => chunks.push(chunk))
      .on('error', console.error)
      .on('end', () => this.addToQueue(chunks));

    parser.write(member);
    parser.end();
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

    this.flushTimeout = setInterval(con => con.flush(), 3_000, this);
    this.versionConstraintTimeout = setInterval(con => con.versionConstraint(), 4_000, this);
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    clearInterval(this.flushTimeout);
    clearInterval(this.versionConstraintTimeout);
    this.endpoint.disconnect();
  }
}
