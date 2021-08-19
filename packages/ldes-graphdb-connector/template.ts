import type { IConfigTemplate } from '@ldes/types';

export const template: IConfigTemplate = {
  name: '@ldes/ldes-graphdb-connector',
  image: 'khaller/graphdb-free',
  fields: [
    {
      name: 'username',
      validation: ['string'],
    },
    {
      name: 'password',
      validation: ['string'],
    },
    {
      name: 'repository',
      validation: ['required', 'string'],
      value: 'Test',
    },
    {
      name: 'baseUrl',
      validation: ['required', 'string'],
      value: 'http://localhost:7200',
    },
    {
      name: 'graphPrefix',
      validation: ['required', 'string'],
      value: 'http://localhost/graph/',
    },
  ],
  composeTemplate: ``,
  helmTemplate: ``,
};
