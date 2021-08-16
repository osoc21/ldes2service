import type { IConnectorConfig } from '@ldes/types';
import * as execa from 'execa';

const LDES_CONNECTORS = new Set([
  '@ldes/ldes-postgres-connector',
  '@ldes/ldes-mongodb-connector',
  '@ldes/ldes-graphdb-connector',
]);

export async function dependenciesSetup(config: any): Promise<void> {
  const neededConnectors = Object.values(config.connectors).map((con: IConnectorConfig) => con.type);

  for (const con of neededConnectors) {
    console.log(`Adding ${con}...`);
    await execa('npm', ['run', 'lerna', '--', 'add', con, '--scope=@ldes/replicator']);
  }
  if (neededConnectors.filter(el => !LDES_CONNECTORS.has(el)).length === 0) {
    console.log('Skipping install...');
    return;
  }
  console.log('Installing dependencies...');
  const install = execa('npm', ['i']);
  if (install.stdout) {
    install.stdout.pipe(process.stdout);
  }
  if (install.stderr) {
    install.stderr.pipe(process.stderr);
  }
  await install;
}
