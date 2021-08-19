import type { IConfigTemplate } from '@ldes/types';

export const template: IConfigTemplate = {
  name: '@ldes/ldes-mongodb-connector',
  image: 'mongo:latest',
  fields: [
    {
      name: 'hostname',
      validation: ['required', 'string'],
      value: 'localhost',
    },
    {
      name: 'username',
      validation: ['string'],
    },
    {
      name: 'password',
      validation: ['string'],
    },
    {
      name: 'database',
      validation: ['required', 'string'],
      value: 'admin',
    },
    {
      name: 'port',
      validation: ['required', 'number'],
      value: '27017',
    },
    {
      name: 'connectionString',
      validation: ['string'],
    },
    {
      name: 'extraParameters',
      validation: ['string'],
    },
  ],
  composeTemplate: `
{hostname}:
  image: bitnami/mongodb
  restart: always
  environment:
    MONGODB_USERNAME: {username}
    MONGODB_PASSWORD: {password}
    MONGODB_DATABASE: {database}
    MONGODB_PORT_NUMBER: {port}
  ports:
    - "{port}:{port}"
  `,
  helmTemplate: `
name: {hostname}
chart: bitnami/mongodb
namespace: ldes
createNamespace: true
values:
  - auth:
      username: "{username}"
      password: "{password}"
      database: "{database}"
  - service.nodePort: "{port}"
  `,
};
