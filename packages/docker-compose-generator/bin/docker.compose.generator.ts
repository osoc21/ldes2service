import { DockerComposeGenerator } from '../lib/DockerComposeGenerator';

const fastify = require('fastify')({ logger: true });

fastify.get('/', async (_request: any, _reply: any) => ({ hello: 'world' }));

fastify.post(
  '/create',
  {
    schema: {
      body: {
        type: 'object',
        required: ['services'],
        properties: {
          services: {
            type: 'array',
            default: ['MONGODB'],
            items: { type: 'string' },
          },
        },
      },
    },
  },
  async (_request: any, _reply: any) => {
    const dockerComposeGenerator = new DockerComposeGenerator(_request.body);
    _reply.send(dockerComposeGenerator.createDockerCompose());
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
