import type { IGeneratorApiSetup } from '@ldes/types';
import { stringify, parse } from 'yaml';

const format = require('string-format');

interface IHelmFile {
  repositories: Record<string, string>[];
  releases: Record<string, any>[];
}

export class HelmFileGenerator {
  private options: IGeneratorApiSetup[];

  public setup(options: IGeneratorApiSetup[]): void {
    this.options = options;
  }

  public generate(services: string[], settings: Record<string, any>): string {
    const HelmFile: IHelmFile = {
      repositories: [{ name: 'bitnami', url: 'https://charts.bitnami.com/bitnami' }],
      releases: [],
    };

    for (const service of this.options) {
      if (services.includes(service.id)) {
        const formattedService = parse(format(service.helmTemplate, settings[service.id]));

        HelmFile.releases.push(formattedService);
      }
    }

    return stringify(HelmFile);
  }
}
