import React from 'react';
import { IConnectorService } from '../../../../ldes-types';
import { H1, H2, H3 } from '../../components/Headings';
import { Input, InputGroup, Label } from '../../components/Input';
import { Td, Th, Tr } from '../../components/Table';

type Props = {
  service: IConnectorService;
};

export function ServiceDetail(props: Props) {
  const { service } = props;

  return (
    <div>
      <H1>{service.name}</H1>
      <div className="mt-6">
        <H2>MongoDB is a powerful document based database which allows for ...</H2>
      </div>
      <div className="mt-8">
        <H3>Configuration</H3>
        <InputGroup>
          <Label htmlFor="connection_string">Connection string</Label>
          <Input id="connection_string" value="mongodb://root:root@127.0.0.1:27017" />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="collection">Collection</Label>
          <Input id="collection" />
        </InputGroup>
      </div>
      <div className="mt-8">
        <H3>Event Streams attached to this service</H3>
        <table className="w-full mt-2">
          <thead>
            <Tr>
              <Th>Name</Th>
              <Th>URL</Th>
              <Th className="text-right">Status</Th>
            </Tr>
          </thead>
          <tbody>
            <Tr>
              <Td>De Lijn</Td>
              <Td>https://www.delijn.be/datasets/ldes</Td>
              <Td className="text-right">100%</Td>
            </Tr>
            <Tr>
              <Td>NMBS</Td>
              <Td>https://www.nmbs.be/datasets/ldes</Td>
              <Td className="text-right">100%</Td>
            </Tr>
            <Tr>
              <Td>Parking Ghent</Td>
              <Td>https://data.stad.gent/parkings/LDES</Td>
              <Td className="text-right">75%</Td>
            </Tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
