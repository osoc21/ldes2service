import type { IConfigTemplate } from '@ldes/types';

export const template: IConfigTemplate = {
  name: '@ldes/ldes-mongodb-connector',
  image: 'mongo:latest',
  fields: [
    {
      name: 'hostname',
      validation: ['required', 'string'],
      value: 'default value',
    },
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
      name: 'database',
      validation: ['required', 'string'],
      value: 'default value',
    },
    {
      name: 'port',
      validation: ['required', 'number'],
      value: 'default value',
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
