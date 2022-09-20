import { Data2D } from '../Data2D';
import { Info2D } from '../Info/Info2D';
import { Zones } from '../Zones/Zones';

import { Spectrum } from './Spectrum';

export interface Spectrum2D extends Spectrum {
  zones: Zones;
  meta: any;
  filters: Array<any>;
  data: Data2D;
  info: Info2D;
  originalInfo?: Info2D;
  originalData: Data2D;
}
