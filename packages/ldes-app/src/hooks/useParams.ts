import { useLocation, useParams as RRDUseParams } from 'react-router-dom';

const useParams = (): { [k in string]: string } => ({
  ...RRDUseParams(),
  // @ts-ignore
  ...Object.fromEntries([...new URLSearchParams(useLocation().search).entries()]),
});

export default useParams;
