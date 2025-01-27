import type { IGeneratorPluginOptions } from '@ldes/types';
import fastify from 'fastify';
import { router } from '../lib/GeneratorPlugin';

const server = fastify({ logger: true });

const start = async (): Promise<void> => {
  try {
    await server.register<IGeneratorPluginOptions>(router, { setup: true, prefix: '/gen' });
    await server.listen(3_000);
  } catch (error: unknown) {
    console.error('Error:', error);
    process.exit(1);
  }
};

start()
  .then(() => console.log('Listening!'))
  .catch(error => console.error(error));
