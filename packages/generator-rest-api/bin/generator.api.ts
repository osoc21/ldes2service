import { DockerComposeGenerator } from '@ldes/docker-compose-generator';
import { HelmFileGenerator } from '@ldes/helm-file-generator';
import { MongoDbConnector } from '@ldes/ldes-mongodb-connector';
import { PostgresConnector } from '@ldes/ldes-postgres-connector';
import type { IGeneratorApiSetup } from '@ldes/types';

const fastify = require('fastify')({ logger: true });

const dockerComposeGenerator = new DockerComposeGenerator();
const helmFileGenerator = new HelmFileGenerator();

/* We will use the default connectors until this is connected to the manager  */
const setup: IGeneratorApiSetup[] = [
  {
    id: 'postgres',
    helmTemplate: PostgresConnector.helmTemplate,
    composeTemplate: PostgresConnector.composeTemplate,
  },
  {
    id: 'mongodb',
    helmTemplate: MongoDbConnector.helmTemplate,
    composeTemplate: MongoDbConnector.composeTemplate,
  },
];

helmFileGenerator.setup(setup);
dockerComposeGenerator.setup(setup);

fastify.post(
  '/setup',
  {
    schema: {
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            helmTemplate: { type: 'string' },
            composeTemplate: { type: 'string' },
          },
        },
      },
    },
  },
  async (_request: any, _reply: any) => {
    dockerComposeGenerator.setup(_request.body);
    helmFileGenerator.setup(_request.body);
    _reply.send('Generators updated.');
  }
);

fastify.post(
  '/create',
  {
    schema: {
      body: {
        type: 'object',
        required: ['services'],
        properties: {
          services: {
            type: 'object',
          },
          type: { type: 'string' },
        },
      },
    },
  },
  async (_request: any, _reply: any) => {
    const serviceNames = Object.keys(_request.body.services);
    switch (_request.body.type) {
      case 'helm':
        _reply.send(helmFileGenerator.generate(serviceNames, _request.body.services));
        break;
      case 'compose':
        _reply.send(dockerComposeGenerator.generate(serviceNames, _request.body.services));
        break;
      default:
        _reply.send('No file type was selected!');
    }
  }
);

const start = async (): Promise<void> => {
  try {
    await fastify.listen(3_000);
  } catch (error: unknown) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Tslint make me made the final catch
start()
  .catch(error => console.error(error))
  .then(() => console.log('Listening!'))
  .catch(() => 'obligatory catch');
