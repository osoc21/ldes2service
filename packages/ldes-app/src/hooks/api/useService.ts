import { useQuery } from 'react-query';
import { IConnectorService } from '@ldes/types';

export function useServices(id: string) {
  return useQuery<IConnectorService>(
    'connector-service/1',
    () => ({
      id: '1',
      name: 'MongoDB',
      image: 'mongo:latest',
      configuration: JSON.stringify(''),
    }),
    {
      enabled: !!id,
    }
  );
}
