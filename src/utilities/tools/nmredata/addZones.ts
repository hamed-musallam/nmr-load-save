import { Signal2D } from '../../../types/Signals/Signal2D';
import { Spectrum2D } from '../../../types/Spectra/Spectrum2D';
import { Zone } from '../../../types/Zones/Zone';
import generateID from '../../generateID';

type AxisLabels = 'x' | 'y';
interface Signal2DFromNmredata
  extends Record<
    AxisLabels,
    {
      delta: number;
      coupling?: Array<{ coupling: number; diaIDs?: string[] }>;
      diaIDs?: string[];
    }
  > {
  activeCoupling: Array<{ coupling: number; diaIDs?: string[] }>;
}

const axisLabels: AxisLabels[] = ['x', 'y'];
const defaultShift = { x: 0, y: 0 };

export function addZones(
  signals: Signal2DFromNmredata[],
  datum: Spectrum2D,
  options: any = {},
) {
  let zones: any[] = [];
  const { shift = defaultShift } = options;
  const { originFrequency = [400, 400] } = datum.info;
  const frequency = { x: originFrequency[0], y: originFrequency[1] };

  for (const signal of signals) {
    let zone: Partial<Zone> = {
      x: {},
      y: {},
      id: generateID(),
      kind: 'signal',
    };
    let signalFormated: Partial<Signal2D> = {
      id: generateID(),
      kind: 'signal',
      peak: [],
    };
    let width = { x: 10, y: 10 };
    for (let axis of axisLabels) {
      let { coupling = [], delta, diaIDs = [] } = signal[axis];
      for (let j of coupling) {
        width[axis] += j.coupling;
      }
      if (signal.activeCoupling) {
        const { activeCoupling = [] } = signal;
        for (let j of activeCoupling) {
          width[axis] += j.coupling;
        }
      }
      width[axis] /= frequency[axis];

      zone[axis] = {
        from: delta - width[axis],
        to: delta + width[axis],
      };

      signalFormated[axis] = {
        delta,
        diaIDs,
        originDelta: delta - shift[axis],
      };
    }
    zones.push({
      ...zone,
      signals: [signalFormated],
    });
  }
  datum.zones.values = zones;
}
