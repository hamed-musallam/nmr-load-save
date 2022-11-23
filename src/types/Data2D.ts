import { DoubleArray } from 'cheminfo-types';

export interface Data2D {
  z: Array<DoubleArray>;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}
