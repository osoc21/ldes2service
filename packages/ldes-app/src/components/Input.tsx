import React from 'react';
import c from '../utils/c';

type InputGroupProps = {
  className?: string;
  children: React.ReactNode;
};

type LabelProps = JSX.IntrinsicElements['label'] & {
  htmlFor: string;
};

type InputProps = JSX.IntrinsicElements['input'] & {
  id: string;
};

export const InputGroup = (props: InputGroupProps) => {
  const { className, children } = props;

  return <div className={c(className, 'flex flex-col mb-3')}>{children}</div>;
};

export const Label = (props: LabelProps) => {
  return <label className={c('w-full mb-1', props.className)} {...props} />;
};

export const Input = (props: InputProps) => {
  const { type = 'text', className, ...rest } = props;

  return <input type={type} className={c('w-full py-1 px-2', className)} {...rest} />;
};
