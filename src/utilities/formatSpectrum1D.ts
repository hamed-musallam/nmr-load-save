import { isAnyArray } from 'is-any-array';

import { UsedColors } from '../reader/UsedColors';
import { Spectrum1D } from '../types/Spectra/Spectrum1D';

import generateID from './generateID';
import { get1DColor } from './getColor';
import { getData } from './getData';

export function formatSpectrum1D(
  spectrumData: any,
  usedColors: UsedColors,
): Spectrum1D {
  const {
    id = generateID(),
    shiftX = 0,
    meta,
    peaks = {},
    filters = [],
    info = {},
    source = {},
    dependentVariables = [],
  } = spectrumData;
  let spectrum: any = { id, shiftX, meta, filters };

  spectrum.source = {
    ...{
      jcampURL: null,
    },
    ...source,
  };

  spectrum.originalInfo = spectrum.info;

  let { data = getData(dependentVariables[0].components) } = spectrumData;

  if (isAnyArray(data.im)) info.isComplex = true;
  if (Array.isArray(info.nucleus)) info.nucleus = info.nucleus[0];

  spectrum.data = {
    ...{
      x: [],
      re: [],
      im: [],
    },
    ...data,
  };

  spectrum.info = {
    ...{
      nucleus: '1H', // 1H, 13C, 19F, ...
      isFid: false,
      isComplex: false, // if isComplex is true that mean it contains real/ imaginary  x set, if not hid re/im button .
      dimension: 1,
    },
    ...info,
  };

  spectrum.display = {
    name: spectrumData.display?.name ? spectrumData.display.name : id,
    ...getColor(spectrumData, usedColors),
    isVisible: true,
    isPeaksMarkersVisible: true,
    isRealSpectrumVisible: true,
    isVisibleInDomain: true,
    ...spectrumData.display,
  };

  spectrum.originalData = spectrum.data;

  spectrum.peaks = { ...{ values: [], options: {} }, ...peaks };

  spectrum.integrals = {
    ...{ values: [], options: { sum: 100 } },
    ...spectrumData.integrals,
  };

  spectrum.ranges = {
    ...{ values: [], options: { sum: 100 } },
    ...spectrumData.ranges,
  };

  return spectrum;
}

function getColor(options: any, usedColors: UsedColors) {
  let color = 'black';
  if (options?.display?.color === undefined) {
    color = get1DColor(false, usedColors['1d'] || []);
  } else {
    color = options.display.color;
  }

  if (usedColors['1d']) {
    usedColors['1d'].push(color);
  }

  return { color };
}
