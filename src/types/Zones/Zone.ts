import { RangeAxis } from '../Ranges/RangeAxis';
import { Signal2D } from '../Signals/Signal2D';

export interface Zone {
  id: string;
  x: Partial<RangeAxis>;
  y: Partial<RangeAxis>;
  signal: Array<Signal2D>;
  kind: string;
}
