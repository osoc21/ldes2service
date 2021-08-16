import type { IConfigTemplate } from '@ldes/types';

export const template: IConfigTemplate = {
  name: '@ldes/ldes-graphdb-connector',
  image: 'khaller/graphdb-free',
  fields: [
    {
      name: 'username',
      validation: ['required', 'string'],
      value: 'default value',
    },
    {
      name: 'password',
      validation: ['required', 'string'],
      value: 'default value',
    },
    {
      name: 'repository',
      validation: ['required', 'string'],
      value: 'default value',
    },
    {
      name: 'baseUrl',
      validation: ['required', 'string'],
      value: 'default value',
    },
  ],
  composeTemplate: ``,
  helmTemplate: ``,
};
