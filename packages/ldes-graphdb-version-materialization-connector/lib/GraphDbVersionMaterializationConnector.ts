import type { IConfigConnector, IWritableConnector, LdesShape } from '@ldes/types';
import { JsonLdParser } from 'jsonld-streaming-parser';
import { DataFactory } from 'rdf-data-factory';
import type { Update, UpdateOperation } from 'sparqljs';
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

export class GraphDbVersionMaterializationConnector implements IWritableConnector {
  private readonly config: IConfigGraphDbConnector;
  private readonly shape: LdesShape;
  private queue: UpdateOperation[] = [];
  private flushTimeout: NodeJS.Timer;
  private endpoint: any;
  private readonly id: string;
  private readonly graph: string;
  private readonly versionConstraintInProgress = false;

  public constructor(config: IConfigConnector, shape: LdesShape, id: string) {
    if (!config.versions || !config.versions.identifier) {
      throw new Error('This Version Materialization Connector requires a version identifier to be present.');
    }

    this.config = { ...defaultConfig, ...config };
    this.id = id;
    this.shape = shape;
    this.graph = this.config.graphPrefix + this.id;
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }
    const updates = this.queue.slice();
    this.queue = [];

    console.debug('Sending', updates.length / 2, 'updates');

    const generator = new SparqlGenerator();
    const query: Update = {
      type: 'update',
      prefixes: {},
      updates,
    };

    const stringQuery = generator.stringify(query);

    // Console.debug(stringQuery);

    await this.endpoint.update(stringQuery);
  }

  public async addToQueue(quads: any): Promise<void> {
    if (quads.length === 0) {
      return;
    }

    const versionNode = quads[0].subject;
    const elementNode = quads.find(
      (quad: any) => quad.predicate.value === this.config.versions?.identifier
    )?.object;

    const elementQuads = quads
      // We get rid if the versioning quad
      .filter((quad: any) => quad.predicate.value !== this.config.versions?.identifier)
      // We replace the version subject with the generic one
      .map((quad: any) => {
        quad.subject = elementNode;
        return quad;
      });

    elementQuads.push(
      factory.quad(elementNode, factory.namedNode('http://purl.org/dc/terms/hasVersion'), versionNode)
    );

    const triples = [
      {
        subject: elementNode,
        predicate: factory.variable('p'),
        object: factory.variable('o'),
      },
    ];

    const updates: UpdateOperation[] = [
      {
        updateType: 'insertdelete',
        graph: factory.namedNode(this.graph),
        insert: [],
        delete: [
          {
            type: 'bgp',
            triples,
          },
        ],
        where: [
          {
            type: 'bgp',
            triples,
          },
        ],
      },
      {
        updateType: 'insert',
        insert: [
          {
            type: 'graph',
            name: factory.namedNode(this.graph),
            triples: elementQuads,
          },
        ],
      },
    ];

    this.queue.push(...updates);
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
    if (!this.fieldInShape(this.config.versions?.identifier)) {
      throw new Error("The versioning fields couldn't be found in the SHACL shape");
    }

    this.endpoint = new EnapsoGraphDBClient.Endpoint({
      prefixes: DEFAULT_PREFIXES,
      baseURL: this.config.baseUrl,
      repository: this.config.repository,
    });

    if (this.config.username) {
      await this.endpoint.login(this.config.username, this.config.username);
    }

    this.flushTimeout = setInterval(con => con.flush(), 1_000, this);
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    clearInterval(this.flushTimeout);
    this.endpoint.disconnect();
  }

  public fieldInShape(field: string | undefined): boolean {
    return this.shape.some(f => f.path === field);
  }
}
