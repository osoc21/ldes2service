import type { IWritableConnector, IConfigConnector, LdesShape } from '@ldes/types';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import slugify from 'slugify';

export interface IConfigMongoDbConnector extends IConfigConnector {
  username?: string;
  hostname: string;
  database: string;
  password?: string;
  port: number;
  connectionString?: string;
  extraParameters?: string;
}
const defaultConfig: IConfigMongoDbConnector = {
  hostname: 'localhost',
  database: 'admin',
  port: 27_017,
  extraParameters: '',
};

export class MongoDbConnector implements IWritableConnector {
  private readonly config: IConfigMongoDbConnector;
  private client: MongoClient;
  private db: Db;
  private readonly shape?: LdesShape;
  private readonly id: string;
  private readonly columnToFieldPath: Map<string, string> = new Map();

  public constructor(config: IConfigMongoDbConnector, shape: LdesShape, id: string) {
    this.config = { ...defaultConfig, ...config };
    this.id = id;
    this.shape = shape;
  }

  private async versioning(member: any): Promise<void> {
    if (!this.config.versions) {
      return;
    }

    const versionId = MongoDbConnector.extractAndSlug(this.config.versions.identifier);
    const sorterSlug = MongoDbConnector.extractAndSlug(this.config.versions.sorter);
    const version = this.getField(member[this.config.versions.identifier]);

    const collection = this.db.collection('ldes');

    const results = await collection
      .find(Object.fromEntries([[versionId, version]]))
      .sort(sorterSlug, 1)
      .toArray();

    const numberToDelete = results.length - this.config.versions.amount;

    if (numberToDelete > 0) {
      const idsToRemove = results.slice(0, numberToDelete).map((value: any) => value._id);

      await collection.deleteMany({ _id: { $in: idsToRemove } });
    }
  }

  /**
   * Writes a version to the corresponding backend system
   * @param member
   */
  public async writeVersion(member: any): Promise<void> {
    const JSONmember = JSON.parse(member);

    const data: any = {};

    Array.from(this.columnToFieldPath.keys()).forEach(key => {
      // @ts-expect-error get never returns undefined
      data[key] = this.getField(JSONmember[this.columnToFieldPath.get(key)]);
    });

    data.data = member;

    const collection = this.db.collection(this.id);
    await collection.insertOne(data);

    if (this.config.versions) {
      await this.versioning(JSONmember);
    }
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   */
  public async provision(): Promise<void> {
    const url = this.getURI();

    this.client = new MongoClient(url);

    this.shape?.forEach(field => {
      const slugField = MongoDbConnector.extractAndSlug(field.path);
      this.columnToFieldPath.set(slugField, field.path);
    });

    // Connect the client to the server
    await this.client.connect();

    // Establish and verify connection
    this.db = this.client.db(this.config.database);
  }

  private getURI(): string {
    const conf = this.config;
    const auth = conf.username && conf.password ? `${conf.username}:${conf.password}@` : '';

    return (
      conf.connectionString ??
      `mongodb://${auth}${conf.hostname}:${conf.port}/${conf.database}${conf.extraParameters}`
    );
  }

  private static extractAndSlug(value: string): string {
    const reg = /([^#/]+$)/gmu;
    return slugify(value.match(reg)![0], { remove: /[*+~.()'"!:@/]/gu, lower: true, replacement: '_' });
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    await this.client.close();
  }

  private getField(property: any): string | null {
    const value: string | undefined = property?.['@value'] ?? property?.['@id'] ?? property;

    if (value === undefined || value === null) {
      return null;
    }

    return value;
  }
}
