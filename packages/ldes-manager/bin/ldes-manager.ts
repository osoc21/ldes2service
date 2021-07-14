import { DummyState } from '@ldes/ldes-dummy-state';
import { MongoDbConnector } from '@ldes/ldes-mongodb-connector';
import { PostgresConnector } from '@ldes/ldes-postgres-connector';
import type { IManagerConfig } from '../lib/Manager';
import { Manager } from '../lib/Manager';

const config: IManagerConfig = {
  state: DummyState,
  connectors: {
    postgres: PostgresConnector,
    mongodb: MongoDbConnector,
  },
  queryServices: [
    {
      name: 'My Postgres DB',
      description: 'Contains Gent Objects and street names',
      settings: {
        amountOfVersions: 1,
        databaseName: 'ldes',
        host: 'localhost',
        username: 'postgres',
        password: 'postgres',
      },
      connector: 'postgres',
      replicators: [
        {
          name: 'GentObjects',
          url: 'https://apidg.gent.be/opendata/adlib2eventstream/v1/dmg/objecten',
          pollingInterval: 5_000,
        },
        {
          name: 'StreetNamesVlaanderen',
          url: 'https://smartdata.dev-vlaanderen.be/base/straatnaam',
          pollingInterval: 5_000,
        },
      ],
    },
  ],
};

async function run(): Promise<void> {
  const manager = new Manager(config);
  await manager.provision();
  await manager.run();
}
run().catch(error => console.error(error));
