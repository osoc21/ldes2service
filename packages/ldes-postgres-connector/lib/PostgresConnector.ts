import type { IWritableConnector, IConfigConnector, LdesShape } from '@ldes/types';
import type { PoolClient } from 'pg';
import { Pool } from 'pg';
import slugify from 'slugify';

export interface IConfigPostgresConnector extends IConfigConnector {
  username: string;
  hostname: string;
  database: string;
  password: string;
  port: number;
}

const defaultConfig: IConfigPostgresConnector = {
  username: 'postgres',
  hostname: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5_432,
};

enum PostgresDataType {
  TEXT = 'TEXT',
  TIMESTAMP = 'TIMESTAMP',
  JSONB = 'JSONB',
  INT = 'INT',
}

const dataTypes = new Map<string, PostgresDataType>([
  ['iri', PostgresDataType.TEXT],
  ['datetime', PostgresDataType.TIMESTAMP],
  ['string', PostgresDataType.TEXT],
  ['langstring', PostgresDataType.TEXT],
  ['concept', PostgresDataType.TEXT],
  ['label', PostgresDataType.TEXT],
  ['integer', PostgresDataType.INT],
]);

export class PostgresConnector implements IWritableConnector {
  private readonly config: IConfigPostgresConnector;
  private readonly shape?: LdesShape;
  private pool: Pool;
  private poolClient: PoolClient;
  private readonly columnToFieldPath: Map<string, string> = new Map();
  private readonly id: string;

  public constructor(config: IConfigPostgresConnector, shape: LdesShape, id: string) {
    this.config = { ...defaultConfig, ...config };
    this.shape = shape;
    this.id = id;
  }

  private async versioning(member: any): Promise<void> {
    if (!this.config.versions) {
      return;
    }

    const versionId = PostgresConnector.extractAndSlug(this.config.versions.identifier);
    const sorterSlug = PostgresConnector.extractAndSlug(this.config.versions.sorter);
    const element = this.getField(member[this.config.versions.identifier]);

    const { rows: results } = await this.poolClient.query(
      `SELECT * FROM "${this.id}" WHERE ${versionId} = $1 ORDER BY ${sorterSlug} ASC`,
      [element]
    );

    const numberToDelete = results.length - this.config.versions.amount;

    if (numberToDelete > 0) {
      const idsToRemove = results.slice(0, numberToDelete).map((value: any) => `'${value.id}'`);

      await this.pool.query(`DELETE FROM "${this.id}" WHERE id IN (${idsToRemove.join(', ')})`);
    }
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: string): Promise<void> {
    const JSONmember: object = JSON.parse(member);
    //
    // console.debug('Member to write :', JSONmember);
    // console.log(JSONmember);

    const columns = Array.from(this.columnToFieldPath.keys());
    const values = [];

    let query = `INSERT INTO "${this.id}" (`;
    if (columns.length > 0) {
      query = query
        .concat(columns.join(', '), ', data) VALUES (')
        .concat(columns.map((_item, index) => `$${index + 1}`).join(', '), `, $${columns.length + 1});`);

      // @ts-expect-error the get method will never return undefined by definition
      values.push(...columns.map(column => this.getField(JSONmember[this.columnToFieldPath.get(column)])));
    } else {
      query = query.concat('data) VALUES ($1);');
    }

    values.push(member);

    await this.poolClient.query(query, values);

    if (this.config.versions) {
      await this.versioning(JSONmember);
    }
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   * Table definition:
   *   "id" URI representing the event
   *   "type" URI representing the event type
   *   "data" The rest
   */
  public async provision(): Promise<void> {
    this.pool = new Pool({
      user: this.config.username,
      host: this.config.hostname,
      database: this.config.database,
      password: this.config.password,
      port: this.config.port,
    });

    this.poolClient = await this.pool.connect();

    let query = `CREATE TABLE IF NOT EXISTS "${this.id}" (table_id SERIAL PRIMARY KEY`;

    this.shape?.forEach(field => {
      const slugField = PostgresConnector.extractAndSlug(field.path);
      // Console.debug('datatype :', field.path, field.datatype);
      this.columnToFieldPath.set(slugField, field.path);
      query = query.concat(
        `, ${slugField} ${dataTypes.get(PostgresConnector.extractAndSlug(field.datatype)) ?? 'TEXT'}`
      );
    });

    query = query.concat(`, data ${PostgresDataType.JSONB} NOT NULL);`);

    console.debug('Creation table query', query);
    // Console.debug('Paths:', [this.columnToFieldPath.values()]);
    // Console.debug('Shape:', this.shape);

    await this.pool.query(query);
  }

  private static extractAndSlug(value: string): string {
    const reg = /([^#/]+$)/gmu;
    return slugify(value.match(reg)![0], { remove: /[!"'()*+./:@~]/gu, lower: true, replacement: '_' });
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    this.poolClient.release();
    return this.pool.end();
  }

  private getField(property: any): string | null {
    const value: string | undefined = property?.['@value'] ?? property?.['@id'] ?? property;

    if (value === undefined || value === null) {
      return null;
    }

    return value;
  }
}
