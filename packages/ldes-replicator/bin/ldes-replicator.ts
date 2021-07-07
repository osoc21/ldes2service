/**
 * CLI interface where manual dependency injection happens
 */

import { DummyConnector } from '@ldes/ldes-dummy-connector';
import { DummyState } from '@ldes/ldes-dummy-state';

import { newEngine } from '@treecg/actor-init-ldes-client';
import 'dotenv/config';
import { Orchestrator } from '../lib/Orchestrator';

// TODO: Parse and use CLI parameters

const URL = process.env.URL || 'https://apidg.gent.be/opendata/adlib2eventstream/v1/dmg/objecten';
const POLL_INTERVAL = Number.parseInt(process.env.pollingInterval || '5000', 10);

async function run(): Promise<void> {
  const connector = new DummyConnector();
  const state = new DummyState();

  const options = {
    pollingInterval: POLL_INTERVAL,
  };
  const LDESClient = newEngine();
  const eventstreamSync = LDESClient.createReadStream(URL, options);

  const orchestrator = new Orchestrator([connector], state, eventstreamSync);

  await orchestrator.provision();
  await orchestrator.run();
}

run().catch(error => console.error(error));
