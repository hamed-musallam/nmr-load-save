import { DoubleArray } from 'cheminfo-types';

export interface DataXYReIm {
  /** Array of x values */
  x?: DoubleArray;
  /** Array of re values */
  y?: DoubleArray;
  /** Array of re values */
  re?: DoubleArray;
  /** Array of im values */
  im?: DoubleArray;
}

interface Spectra1D {
  data?: DataXYReIm;
}

export function getData(spectra: Spectra1D[]) {
  let x = spectra[0]?.data?.x || [];
  let re = spectra[0]?.data?.re || spectra[0]?.data?.y || [];
  let im = spectra[0]?.data?.im || spectra[1]?.data?.y || null;

  if (x.length > 0 && x[0] > x[1]) {
    x.reverse();
    re.reverse();
    if (im) im.reverse();
  }

  return { x, re, im };
}
