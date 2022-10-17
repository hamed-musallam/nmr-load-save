import { Data1D } from '../Data1D';
import { Integrals } from '../Integrals';
import { Peaks } from '../Peaks/Peaks';
import { Ranges } from '../Ranges/Ranges';

import { Spectrum } from './Spectrum';

export interface Spectrum1D extends Spectrum {
  data: Data1D;
  originalData?: Data1D;
  peaks: Peaks;
  integrals: Integrals;
  ranges: Ranges;
  meta: Record<string, any>;
  info: Record<string, any>;
  originalInfo: Record<string, any>;
  filters: Array<any>;
}
