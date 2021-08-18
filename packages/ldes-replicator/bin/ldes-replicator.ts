/**
 * CLI interface where manual dependency injection happens
 */

import * as fs from 'fs/promises';
import type { IRedisStateConfig } from '@ldes/ldes-redis-state';
import { RedisState } from '@ldes/ldes-redis-state';
import type { ConnectorConfigs, LdesObjects, LdesShape } from '@ldes/types';
import { Command, flags } from '@oclif/command';
import { newEngine } from '@treecg/actor-init-ldes-client';
import type { Quad } from 'n3';
import { DataFactory, Store } from 'n3';
import rdfDereferencer from 'rdf-dereference';
import { storeStream } from 'rdf-store-stream';
import slugify from 'slugify';

import { dependenciesSetup } from '../lib/dependenciesSetup';
import { Orchestrator } from '../lib/Orchestrator';

const { namedNode } = DataFactory;

interface IReplicatorConfig {
  replicator: {
    ldes: {
      url: string;
      shapeUrl?: string;
    }[];
    state: IRedisStateConfig;
    disable_pulling: boolean;
    polling_interval: number;
  };
  connectors: ConnectorConfigs;
}

/**
 * This code fetches the shape by dereferencing the LDES URI, and then always derefencing the shape again
 * TODO We might want to catch the fact that possibly the shape is already contained in the received quads.
 */
async function fetchShape({ ldesURI, shapeURI }: Record<string, any>): Promise<LdesShape> {
  const defaultShape = [
    {
      path: '@id',
      datatype: 'https://www.w3.org/ns/shacl#IRI',
    },
    {
      path: '@type',
      datatype: 'https://www.w3.org/ns/shacl#IRI',
    },
  ];
  const { quads: ldesQuads } = await rdfDereferencer.dereference(ldesURI);

  // This is the store with shacl quads
  let store: Store = new Store();

  if (!shapeURI) {
    const storeQuads: Store = <Store>await storeStream(ldesQuads);
    storeQuads
      .getQuads(namedNode(ldesURI), namedNode('https://w3id.org/tree#shape'), null, null)
      .forEach((quad: Quad) => {
        if (quad.object.termType === 'BlankNode') {
          store = storeQuads;
        } else if (quad.object.termType === 'NamedNode') {
          shapeURI = quad.object.value;
        }
      });
  }
  if (store.size === 0 && shapeURI) {
    const { quads: shapeQuads } = await rdfDereferencer.dereference(shapeURI, { localFiles: true });
    store = <Store>await storeStream(shapeQuads);
  }

  const paths = Object.fromEntries(
    store
      .getQuads(namedNode(shapeURI), namedNode('https://www.w3.org/ns/shacl#property'), null, null)
      .map((quad: Quad) => {
        const shaclProperty = quad.object;
        return store.getQuads(shaclProperty, namedNode('https://www.w3.org/ns/shacl#path'), null, null)[0];
      })
      .map((quad: Quad) => [quad.subject.value, quad])
  );
  const datatypes = Object.fromEntries(
    store
      .getQuads(null, namedNode('https://www.w3.org/ns/shacl#datatype'), null, null)
      .map((quad: Quad) => [quad.subject.value, quad])
  );
  const nodeKinds = Object.fromEntries(
    store
      .getQuads(null, namedNode('https://www.w3.org/ns/shacl#nodeKind'), null, null)
      .map((quad: Quad) => [quad.subject.value, quad])
  );
  const classes = Object.fromEntries(
    store
      .getQuads(null, namedNode('https://www.w3.org/ns/shacl#class'), null, null)
      .map((quad: Quad) => [quad.subject.value, quad])
  );

  const result = Object.entries(paths).map(([id, quad]) => ({
    path: quad.object.value,
    datatype: datatypes[id]?.object.value ?? nodeKinds[id]?.object.value ?? classes[id]?.object.value,
  }));

  return defaultShape.concat(result);
}

class LdesReplicator extends Command {
  public static description = 'describe the command here';

  public static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    setup: flags.boolean({ char: 's', description: 'install the dependencies from the configuration file.' }),
  };

  public static args = [
    {
      name: 'CONFIG',
      description: 'JSON Configuration file',
      default: `${process.cwd()}/config.json`,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags: fl } = this.parse(LdesReplicator);

    try {
      await fs.access(args.CONFIG, 4);
    } catch {
      throw new Error("The config file doesn't exist or isn't a file.");
    }
    const config: IReplicatorConfig = JSON.parse(await fs.readFile(args.CONFIG, { encoding: 'utf8' }));

    if (fl.setup) {
      return await dependenciesSetup(config);
    }

    const state = new RedisState(config.replicator.state);

    const options = {
      pollingInterval: config.replicator.polling_interval,
      disablePolling: config.replicator.disable_pulling,
    };

    const streams: LdesObjects = Object.fromEntries(
      await Promise.all(
        config.replicator.ldes.map(async ldes => [
          ldes.url,
          {
            stream: newEngine().createReadStream(ldes.url, options),
            url: ldes.url,
            name: slugify(ldes.url, { remove: /[!"'()*+./:@~]/gu }),
            shape: await fetchShape({ shapeURI: ldes.shapeUrl, ldesURI: ldes.url }),
          },
        ])
      )
    );

    const orchestrator = new Orchestrator(state, streams, config.connectors);
    await orchestrator.provision();
    await orchestrator.run();
  }
}

// @ts-expect-error It's a promise, not a PromiseLike...
LdesReplicator.run().catch(require('@oclif/errors/handle'));
