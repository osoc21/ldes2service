import type { IGeneratorApiSetup } from '@ldes/types';
import { parse } from 'yaml';

const composer = require('docker-composer');
const format = require('string-format');

interface IComposeFile {
  version: string;
  services: Record<string, any>;
}

export class DockerComposeGenerator {
  private options: IGeneratorApiSetup[];

  public setup(options: IGeneratorApiSetup[]): void {
    this.options = options;
  }

  public generate(services: string[], settings: Record<string, any>): string {
    const dockerFile: IComposeFile = {
      version: '3.9',
      services: {},
    };

    for (const service of this.options) {
      if (services.includes(service.id)) {
        const formattedService = parse(format(service.composeTemplate, settings[service.id]));

        Object.assign(dockerFile.services, formattedService);
      }
    }

    return composer.generate(dockerFile);
  }
}
