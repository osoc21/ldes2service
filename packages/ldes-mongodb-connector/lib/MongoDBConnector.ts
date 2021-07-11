import type { IWritableConnector, IConfigConnector } from '@ldes/types';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

export class MongoDBConnector implements IWritableConnector {
  private readonly config: IConfigConnector;
  private client: MongoClient;
  private db: Db;

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

    // Insert anyway
    const collection = this.db.collection('ldes');
    await collection.insertOne({
      id: JSONmember['@id'],
      type: JSONmember['@type'],
      generated_at: new Date(JSONmember['http://www.w3.org/ns/prov#generatedAtTime']),
      is_version_of: isVersionOf,
      data: member,
    });

    // Do we need to delete the others?
    if (this.config.amountOfVersions > 0) {
      // Count amount of versions
      const results = await collection
        .find({
          is_version_of: isVersionOf,
        })
        .sort({ generated_at: 1 })
        .toArray();

      // If more than amountOfVersions
      // delete te oldest
      const numberToDelete = results.length - this.config.amountOfVersions;

      if (numberToDelete > 0) {
        const idsToRemove = results.slice(0, numberToDelete).map((value: any) => value._id);

        await collection.deleteMany({ _id: { $in: idsToRemove } });
      }
    }
  }

  /**
   * Initializes the backend system by creating tables, counters and/or enabling plugins
   */
  public async provision(): Promise<void> {
    const url = 'mongodb://localhost:27017';

    this.client = new MongoClient(url);

    // Connect the client to the server
    await this.client.connect();

    // Establish and verify connection
    this.db = this.client.db(this.config.databaseName);
  }

  /**
   * Stops asynchronous operations
   */
  public async stop(): Promise<void> {
    await this.client.close();
  }
}
