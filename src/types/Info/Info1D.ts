import { Info } from './Info';

export interface Info1D extends Info {
  nucleus: string;
  originFrequency: number;
  digitalFilter?: number;
}
