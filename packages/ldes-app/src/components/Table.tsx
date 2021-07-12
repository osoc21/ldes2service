import React from 'react';
import c from '../utils/c';

type Props = {
  children: React.ReactNode;
  className?: string;
};

type TrProps = Props & {
  onClick?: () => any;
};

export function Th(props: Props) {
  return (
    <th className={c('border-b-2 border-gray-100 px-2 py-1 text-left font-medium', props.className)}>
      {props.children}
    </th>
  );
}

export function Td(props: Props) {
  return (
    <td className={c('border-b border-gray-100 px-2 py-2 text-left', props.className)}>{props.children}</td>
  );
}

export function Tr(props: TrProps) {
  const { className, children, onClick } = props;

  return (
    <tr
      onClick={onClick}
      className={c('hover:bg-gray-50 transition-colors duration-300', className, onClick && 'cursor-pointer')}
    >
      {children}
    </tr>
  );
}
