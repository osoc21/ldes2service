const composer = require('docker-composer');

export class DockerComposeGenerator {
  private readonly options: any;

  public constructor(options: any) {
    this.options = options;
  }

  public createDockerCompose(): string {
    const dockerFile = {
      version: '3.9',
      services: {},
    };

    console.debug('options :', this.options);

    if (this.options.services.includes('MONGODB')) {
      Object.assign(dockerFile.services, {
        mongo: {
          image: 'mongo',
          restart: 'always',
          environment: {
            MONGO_INITDB_ROOT_USERNAME: 'root',
            MONGO_INITDB_ROOT_PASSWORD: '',
          },
        },
      });
    }

    if (this.options.services.includes('POSTGRES')) {
      Object.assign(dockerFile.services, {
        postgres: {
          image: 'postgres',
          restart: 'always',
          environment: {
            POSTGRES_PASSWORD: '',
          },
        },
      });
    }

    console.debug('docker-compose json:', dockerFile);

    return composer.generate(dockerFile);
  }
}
