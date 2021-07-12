const c = (...classNames: any) => {
  return classNames.filter(Boolean).join(' ');
};

export default c;
