import { useQuery } from 'react-query';
import { IConnectorService } from '@ldes/types';

export function useServices() {
  return useQuery<IConnectorService[]>('connector-services', () => [
    {
      id: '1',
      name: 'MongoDB',
      image: 'mongo:latest',
      configuration: JSON.stringify(''),
    },
    {
      id: '2',
      name: 'ElasticSearch',
      image: 'elasticsearch:latest',
      configuration: JSON.stringify(''),
    },
    {
      id: '3',
      name: 'PostgreSQL',
      image: 'postgresql:latest',
      configuration: JSON.stringify(''),
    },
  ]);
}
