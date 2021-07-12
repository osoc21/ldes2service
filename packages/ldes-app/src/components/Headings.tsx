import React from 'react';
type Props = {
  children: React.ReactNode;
};

export function H1(props: Props) {
  return <h1 className="font-bold text-4xl">{props.children}</h1>;
}

export function H2(props: Props) {
  return <h2 className="text-xl w-full max-w-lg">{props.children}</h2>;
}

export function H3(props: Props) {
  return <h3 className="font-bold text-lg">{props.children}</h3>;
}
