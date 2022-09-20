import { Jcoupling, NMRRange, NMRSignal1D } from 'nmr-processing';

import { Spectrum1D } from '../../../types/Spectra/Spectrum1D';
import { MakeMandatory } from '../../MakeMandatory';
import generateID from '../../generateID';

import { joinRanges } from './utils/joinRanges';
import { mapRanges } from './utils/mapRanges';

type MandatoriesInRange = 'id' | 'integration';
type MandatoriesInSignal = 'id' | 'multiplicity';
export interface NMRRangeWithSignalAndIntegration
  extends MakeMandatory<NMRRange, MandatoriesInRange> {
  signals: MakeMandatory<NMRSignal1D, MandatoriesInSignal>[];
}

interface SignalFromNMReData {
  delta: number;
  nbAtoms?: number;
  multiplicity?: string;
  jCoupling?: Array<{ coupling: number; diaIDs?: string[] }>;
  diaIDs?: string[];
  integration?: number;
}

export function addRanges(signals: SignalFromNMReData[], datum: Spectrum1D) {
  let ranges: NMRRangeWithSignalAndIntegration[] = [];
  const { baseFrequency: frequency = 500 } = datum.info;
  for (const signal of signals) {
    const { delta, diaIDs = [], multiplicity = '', integration = 0 } = signal;

    const js: Jcoupling[] = signal.jCoupling || [];
    const fromTo = computeFromTo({ delta, js, frequency });

    if (js && multiplicity) {
      if (js.length === multiplicity.length) {
        js.sort((a: any, b: any) => b.coupling - a.coupling);
        for (let i = 0; i < js.length; i++) {
          js[i].multiplicity = multiplicity[i];
        }
      }
    }

    ranges.push({
      id: generateID(),
      ...fromTo,
      integration,
      signals: [
        {
          id: generateID(),
          js,
          delta,
          diaIDs,
          multiplicity,
        },
      ],
    });
  }
  datum.ranges.values = mapRanges(joinRanges(ranges), datum);
}

interface ComputeFromToOptions {
  delta: number;
  js?: Jcoupling[];
  frequency: number;
}

function computeFromTo(options: ComputeFromToOptions) {
  const { delta, js: couplings = [], frequency } = options;
  let width = 0.5;
  for (let j of couplings) {
    width += j.coupling;
  }
  width /= frequency;
  return { from: delta - width, to: delta + width };
}
