import { NMRRange } from 'nmr-processing';

import { Signal1D } from '../Signals/Signal1D';

export interface Range
  extends Omit<NMRRange, 'signals' | 'id' | 'integration'> {
  id: string;
  originFrom?: number;
  originTo?: number;
  absolute: number;
  signals: Signal1D[];
  integration: number;
  nbAtoms?: number;
}
