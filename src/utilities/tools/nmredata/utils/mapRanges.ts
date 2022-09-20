import { xyIntegration } from 'ml-spectra-processing';

import { Signal1D } from '../../../../types/Signals/Signal1D';
import { Spectrum1D } from '../../../../types/Spectra/Spectrum1D';
import generateID from '../../../generateID';
import { NMRRangeWithSignalAndIntegration } from '../addRanges';

export function mapRanges<T extends NMRRangeWithSignalAndIntegration>(
  ranges: T[],
  datum: Spectrum1D,
) {
  const { x, re } = datum.data;
  const shiftX = 0;
  return ranges.map((newRange) => {
    const absolute = xyIntegration(
      { x, y: re },
      { from: newRange.from, to: newRange.to, reverse: true },
    );

    const signals = (newRange.signals || []).map<Signal1D>((signal) => {
      const { kind = null, id, js = [], diaIDs = [], ...resSignal } = signal;
      return {
        ...resSignal,
        kind: kind || 'signal',
        js,
        id: id || generateID(),
        originDelta: signal.delta - shiftX,
        diaIDs,
      };
    });

    return {
      ...newRange,
      id: newRange.id || generateID(),
      kind: signals?.[0].kind || 'signal',
      originFrom: newRange.from - shiftX,
      originTo: newRange.to - shiftX,
      absolute,
      signals,
    };
  });
}
