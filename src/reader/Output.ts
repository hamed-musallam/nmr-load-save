// import { Spectrum1D, Spectrum2D, Molecule } from 'cheminfo-types';
import type { Spectrum1D } from '../types/Spectra/Spectrum1D';
import type { Spectrum2D } from '../types/Spectra/Spectrum2D';

export interface Output {
  spectra: Array<Spectrum1D | Spectrum2D>;
  molecules: Array<Record<string, any>>;
}
