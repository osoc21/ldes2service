import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useServices } from '../../hooks/api/useServices';
import { ServiceDetail } from './ServiceDetail';
import { Services } from './Services';

export function ServicesContainer() {
  const { data: services, isLoading, isError } = useServices();

  // Show something useful...
  if (isLoading || isError) {
    return null;
  }

  return <Services services={services || []} />;
}
