const { PostgresConnector } = require('../..');

describe('ldes-postgres-connector', () => {
  let connector;

  beforeEach(async () => {
    connector = new PostgresConnector({
      amountOfVersions: 2,
      databaseName: 'ldes',
    });

    await connector.provision();
  });

  afterEach(async () => {
    try {
      await connector.poolClient.query('TRUNCATE ldes');
    } catch {}

    await connector.stop();
  });

  it('should add the member to the mongodb database', async () => {
    const member = JSON.stringify({
      '@id': '1_1',
      '@type': 'type_1',
      'http://www.w3.org/ns/prov#generatedAtTime': '2021-07-10T11:05:00.000Z',
      'http://purl.org/dc/terms/isVersionOf': {
        '@id': '1',
      },
    });

    await connector.writeVersion(member);
    const { rows: items } = await connector.poolClient.query('SELECT * FROM ldes');

    expect(items.length).toBe(1);

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1_1',
          type: 'type_1',
          is_version_of: '1',
          generated_at: new Date('2021-07-10T11:05:00.000Z'),
          data: JSON.parse(member),
        }),
      ])
    );
  });

  it('should only store the latest 2 versions', async () => {
    const member1 = JSON.stringify({
      '@id': '1_1',
      '@type': 'type_1',
      'http://www.w3.org/ns/prov#generatedAtTime': '2021-07-10T11:05:00.000Z',
      'http://purl.org/dc/terms/isVersionOf': {
        '@id': '1',
      },
    });

    const member2 = JSON.stringify({
      '@id': '1_2',
      '@type': 'type_1',
      'http://www.w3.org/ns/prov#generatedAtTime': '2021-07-10T11:06:00.000Z',
      'http://purl.org/dc/terms/isVersionOf': {
        '@id': '1',
      },
    });

    const member3 = JSON.stringify({
      '@id': '1_3',
      '@type': 'type_1',
      'http://www.w3.org/ns/prov#generatedAtTime': '2021-07-10T11:07:00.000Z',
      'http://purl.org/dc/terms/isVersionOf': {
        '@id': '1',
      },
    });

    await connector.writeVersion(member1);
    await connector.writeVersion(member2);
    await connector.writeVersion(member3);

    const { rows: items } = await connector.poolClient.query('SELECT * FROM ldes');

    expect(items.length).toBe(2);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1_2',
        }),
        expect.objectContaining({
          id: '1_3',
        }),
      ])
    );
  });
});
