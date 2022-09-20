import { Display } from '../Display';
import { Source } from '../Source';

export interface Spectrum {
  id: string;
  source: Source;
  display: Display;
  meta: any;
}
