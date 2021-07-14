import { DockerComposeGenerator } from '@ldes/docker-compose-generator';
import { HelmFileGenerator } from '@ldes/helm-file-generator';
import type { IGeneratorApiSetup } from '@ldes/types';

const fastify = require('fastify')({ logger: true });

const dockerComposeGenerator = new DockerComposeGenerator();
const helmFileGenerator = new HelmFileGenerator();

/* We will use the default connectors until this is connected to the manager  */
const setup: IGeneratorApiSetup[] = [
  {
    id: 'postgres',
    helmTemplate: `
name: postgres
chart: bitnami/postgresql
namespace: ldes
createNamespace: true
values:
  - postgresqlUsername: {username}
  - postgresqlPassword: {password}
  - postgresqlDatabase: {database}
    `,
    composeTemplate: `
postgres: 
  image: postgres
  restart: always
  environment:
    POSTGRES_USER: {username}
    POSTGRES_PASSWORD: {password}
    POSTGRES_DB: {database}
    `,
  },
  {
    id: 'mongodb',
    helmTemplate: `
name: mongo
chart: bitnami/mongodb
namespace: ldes
createNamespace: true
values:
  - auth:
      username: {username}
      password: {password}
      database: {database}
    `,
    composeTemplate: `
mongo:
  image: bitnami/mongodb
  restart: always
  environment:
    MONGODB_USERNAME: {username}
    MONGODB_PASSWORD: {password}
    MONGODB_DATABASE: {database}
    `,
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
