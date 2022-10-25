import { migrate } from '../migration/MigrationManager';
import { Data1D } from '../types/Data1D';
import { Data2D } from '../types/Data2D';
import type { NmriumLikeObject } from '../types/NmriumLikeObject';
import type { Options } from '../types/Options/Options';
import { Spectrum1D } from '../types/Spectra/Spectrum1D';
import { Spectrum2D } from '../types/Spectra/Spectrum2D';
import { formatSpectrum1D } from '../utilities/formatSpectrum1D';
import { formatSpectrum2D } from '../utilities/formatSpectrum2D';
import { getSourceCache } from '../utilities/getSourceCache';

import { processJcamp } from './readJcamp';

export async function readNMRiumObject(
  nmriumData: object,
  options: Options = {},
): Promise<NmriumLikeObject> {
  const data = migrate(nmriumData);
  const nmriumLikeObject: NmriumLikeObject = { ...data, spectra: [] };

  const sourceCache = await getSourceCache(data, options);

  const spectra = nmriumLikeObject.spectra;
  for (let datum of data.spectra) {
    if (datum.source.jcampURL != null) {
      const { jcampURL, jcampSpectrumIndex = 0 } = datum.source;
      const { spectra } = sourceCache[jcampURL];
      mergeData(nmriumLikeObject, datum, spectra[jcampSpectrumIndex]);
    } else if (datum.source.jcamp) {
      const { jcampParsingOptions } = options;
      const { jcampSpectrumIndex = 0 } = datum.source;
      const sourceParsed = processJcamp(
        datum.source.jcamp,
        jcampParsingOptions,
      );
      mergeData(
        nmriumLikeObject,
        datum,
        sourceParsed.spectra[jcampSpectrumIndex],
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
   * global result
   */
  nmriumLikeObject: NmriumLikeObject,
  /**
   * spectrum inside of the income nmrium object
   */
  currentSpectra: Spectrum1D | Spectrum2D,
  /**
   * spectrum from parsed source
   */
  incomeSpectra: Spectrum1D | Spectrum2D,
) {
  if ('ranges' in currentSpectra) {
    let data = incomeSpectra.data as Data1D;
    nmriumLikeObject.spectra.push({
      ...(incomeSpectra as Spectrum1D),
      ...currentSpectra,
      data,
    });
  } else if ('zones' in currentSpectra) {
    let data = incomeSpectra.data as Data2D;
    nmriumLikeObject.spectra.push({
      ...(incomeSpectra as Spectrum2D),
      ...currentSpectra,
      data,
    });
  } else {
    nmriumLikeObject.spectra.push(incomeSpectra);
  }
  return nmriumLikeObject;
}
