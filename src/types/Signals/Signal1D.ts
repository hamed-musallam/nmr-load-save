import { NMRSignal1D } from 'nmr-processing';

type Mandatories = 'id' | 'multiplicity' | 'diaIDs' | 'js';
export interface Signal1D
  extends Required<Pick<NMRSignal1D, Mandatories>>,
    Omit<NMRSignal1D, Mandatories> {
  originDelta?: number;
}
