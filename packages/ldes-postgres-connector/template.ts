import type { IConfigTemplate } from '@ldes/types';

export const template: IConfigTemplate = {
  name: '@ldes/ldes-postgres-connector',
  image: 'postgres:latest',
  fields: [
    {
      name: 'hostname',
      validation: ['required', 'string'],
    },
    {
      name: 'port',
      validation: ['required', 'number'],
      value: '5432',
    },
    {
      name: 'username',
      validation: ['required', 'string'],
      value: 'postgres',
    },
    {
      name: 'password',
      validation: ['required', 'string'],
      value: 'postgres',
    },
    {
      name: 'database',
      validation: ['required', 'string'],
      value: 'postgres',
    },
  ],
  composeTemplate: `
{hostname}: 
  image: bitnami/postgresql
  restart: always
  environment:
    POSTGRES_USER: {username}
    POSTGRES_PASSWORD: {password}
    POSTGRES_DB: {database}
    POSTGRES_PORT_NUMBER: {port}
  ports:
    - "{port}:{port}"
  `,
  helmTemplate: `
name: {hostname}
chart: bitnami/postgresql
namespace: ldes
createNamespace: true
values:
  - postgresqlUsername: "{username}"
  - postgresqlPassword: "{password}"
  - postgresqlDatabase: "{database}"
  - service.nodePort: "{port}"
  `,
};
