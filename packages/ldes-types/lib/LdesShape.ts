import type { Readable } from 'stream';
import type { IState } from './IState';

export interface LdesShapeField {
  path: string;
  datatype: string;
  minCount?: number;
  maxCount?: number;
}

export type LdesShape = LdesShapeField[];

export interface LdesObject {
  url: string;
  name: string;
  state: IState;
  stream: Readable;
  shape: LdesShape;
}

export type LdesObjects = Record<string, LdesObject>;
