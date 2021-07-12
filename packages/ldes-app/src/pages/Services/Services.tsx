import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { IConnectorService } from '../../../../ldes-types';
import { H1, H2 } from '../../components/Headings';
import { Td, Th, Tr } from '../../components/Table';

interface Props {
  services: IConnectorService[];
}

export function Services(props: Props) {
  const { services } = props;
  const history = useHistory();

  const servicesInTheSpotlight = services.slice(0, 3);

  return (
    <div>
      <H1>LDES2Service</H1>
      <div className="mt-6">
        <H2>
          LDES2Service is a set of NPM packages you can use to replicate an LDES in a back-end system of
          choice.
          <br /> Get started!
        </H2>
      </div>
      <div className="mt-8">
        <h3 className="font-bold text-lg">In the spotlight</h3>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mt-2">
          {servicesInTheSpotlight.map(service => (
            <li key={service.id}>
              <Link
                to={`/services/${service.id}`}
                className="bg-gray-50 border border-gray-400 rounded-sm w-full group text-left flex items-stretch p-4"
              >
                <div className="group-hover:underline text-xl font-medium text-blue-500">{service.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-lg">Overview</h3>
        <table className="w-full mt-2">
          <thead>
            <Tr>
              <Th>Name</Th>
              <Th>Image</Th>
              <Th>Port</Th>
            </Tr>
          </thead>
          <tbody>
            {services.map(service => (
              <Tr key={service.id} onClick={() => history.push(`/services/${service.id}`)}>
                <Td>{service.name}</Td>
                <Td>{service.image}</Td>
                <Td>{service.configuration}</Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
