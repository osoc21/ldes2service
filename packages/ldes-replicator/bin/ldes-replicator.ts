/**
 * CLI interface where manual dependency injection happens
 */

import { DummyState } from '@ldes/ldes-dummy-state';
import { PostgresConnector } from '@ldes/ldes-postgres-connector';

import { newEngine } from '@treecg/actor-init-ldes-client';
import { Orchestrator } from '../lib/Orchestrator';

// TODO: Parse and use CLI parameters

const URL = process.env.URL;
const POLL_INTERVAL = Number.parseInt(process.env.pollingInterval ?? '5000', 10);

async function run(): Promise<void> {
  const connector = new PostgresConnector({ amountOfVersions: 0, databaseName: 'ldes' });
  const state = new DummyState();

  const options = {
    pollingInterval: POLL_INTERVAL,
  };

  if (!URL) {
    throw new Error('No LDES URL specified. Have you added the URL environment variable?');
  }

  const LDESClient = newEngine();
  const eventstreamSync = LDESClient.createReadStream(URL, options);

  const orchestrator = new Orchestrator([connector], state, eventstreamSync);

  await orchestrator.provision();
  await orchestrator.run();
}

run().catch(error => console.error(error));
