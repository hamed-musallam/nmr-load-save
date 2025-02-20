import merge from 'lodash.merge';

import { migrate } from '../migration/MigrationManager';
import type { NmriumLikeObject } from '../types/NmriumLikeObject';
import type { ParsingOptions } from '../types/Options/ParsingOptions';
import { Spectrum1D } from '../types/Spectra/Spectrum1D';
import { Spectrum2D } from '../types/Spectra/Spectrum2D';
import { formatSpectrum1D } from '../utilities/formatSpectrum1D';
import { formatSpectrum2D } from '../utilities/formatSpectrum2D';
import generateID from '../utilities/generateID';
import { getSourceCache } from '../utilities/getSourceCache';

import { processJcamp } from './readJcamp';

export async function readNMRiumObject(
  nmriumData: object,
  options: ParsingOptions = {},
): Promise<NmriumLikeObject> {
  const data = migrate(nmriumData);
  const nmriumLikeObject: NmriumLikeObject = { ...data, spectra: [] };
  const sourceCache = await getSourceCache(data, options);

  const spectra = nmriumLikeObject.spectra;
  for (let datum of data.spectra) {
    if (datum.source.jcampURL != null) {
      const { jcampURL, jcampSpectrumIndex = 0 } = datum.source;
      const { spectra, molecules } = sourceCache[jcampURL];
      if (molecules.length > 0) nmriumLikeObject.molecules.push(...molecules);
      nmriumLikeObject.spectra.push(
        mergeData(datum, makeACopyWithNewID(spectra[jcampSpectrumIndex])),
      );
    } else if (datum.source.jcamp) {
      const { jcampParsingOptions } = options;
      const { jcampSpectrumIndex = 0 } = datum.source;
      const { spectra, molecules } = processJcamp(
        datum.source.jcamp,
        jcampParsingOptions,
      );
      if (molecules.length > 0) nmriumLikeObject.molecules.push(...molecules);
      nmriumLikeObject.spectra.push(
        mergeData(datum, makeACopyWithNewID(spectra[jcampSpectrumIndex])),
      );
    } else {
      const { dimension } = datum.info;
      if (dimension === 1) {
        spectra.push(formatSpectrum1D(datum));
      } else if (dimension === 2) {
        spectra.push(formatSpectrum2D(datum));
      }
    }
  }

  return nmriumLikeObject;
}

/**
 * It tries to merge the data in the spectrum item like ranges or filters
 * with the info/meta comes from the parsed source
 * @param nmriumLikeObject
 * @param currentSpectrum data in
 * @param incomeSpectra
 * @returns
 */
function mergeData(
  /**
   * spectrum inside of the income nmrium object
   */
  currentSpectra: Spectrum1D | Spectrum2D,
  /**
   * spectrum from parsed source
   */
  incomeSpectra: Spectrum1D | Spectrum2D,
) {
  const { data: currentData, ...resCurrent } = currentSpectra;
  if ('ranges' in incomeSpectra) {
    const { data, ...resIncome } = incomeSpectra;
    const partialSpectrum = merge(resIncome, resCurrent as Spectrum1D);
    return {
      ...partialSpectrum,
      data,
    };
  } else if ('zones' in incomeSpectra) {
    const { data, ...resIncome } = incomeSpectra;
    const partialSpectrum = merge(resIncome, resCurrent as Spectrum2D);
    return {
      ...partialSpectrum,
      data,
    };
  } else {
    return incomeSpectra;
  }
}

function makeACopyWithNewID(spectrum: Spectrum1D | Spectrum2D) {
  return { ...spectrum, id: generateID() };
}
