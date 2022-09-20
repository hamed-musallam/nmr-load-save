import type { Peak2D } from '../Peaks/Peak2D';

import type { Signal } from './Signal';

interface SignalAxis {
  delta: number;
  diaIDs?: string[];
  originDelta: number;
}

export interface Signal2D extends Signal {
  sign?: number;
  x: SignalAxis;
  y: SignalAxis;
  peak?: Peak2D[];
}
