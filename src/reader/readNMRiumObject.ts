import { migrate } from '../migration/MigrationManager';
import { JcampParsingOptions } from '../types/Options/JcampParsingOptions';
import type { Options } from '../types/Options/Options';
import type { Output } from '../types/Output';
import { formatSpectrum1D } from '../utilities/formatSpectrum1D';
import { formatSpectrum2D } from '../utilities/formatSpectrum2D';

import { processJcamp, readJcampFromURL } from './readJcamp';

export async function readNMRiumObject(
  nmriumData: object,
  options: Options = {},
): Promise<Output> {
  const output: Output = { spectra: [], molecules: [] };
  const data = migrate(nmriumData);
  const spectra = output.spectra;
  let promises = [];

  for (let datum of data.spectra) {
    if (datum.source.jcampURL != null) {
      const { jcampParsingOptions } = options;
      promises.push(
        addJcampFromURL(output, {
          jcampURL: datum.source.jcampURL,
          jcampParsingOptions,
        }),
      );
    } else if (datum.source.jcamp) {
      const { jcampParsingOptions } = options;
      const result = processJcamp(datum.source.jcamp, jcampParsingOptions);

      result.spectra[0] = { ...result.spectra[0], ...datum };
      appendData(output, result);
    } else {
      const { dimension } = datum.info;
      output.molecules.push(...(data.molecules || []));
      if (dimension === 1) {
        spectra.push(formatSpectrum1D(datum));
      } else if (dimension === 2) {
        spectra.push(formatSpectrum2D(datum));
      }
    }
  }
  await Promise.all(promises);
  return output;
}

async function addJcampFromURL(
  output: Output,
  options: {
    jcampURL: string;
    jcampParsingOptions?: JcampParsingOptions;
  },
) {
  const { jcampURL, jcampParsingOptions } = options;
  const result = await readJcampFromURL(jcampURL, jcampParsingOptions);
  return appendData(output, result);
}

function appendData(current: Output, recent: Output) {
  current.spectra.push(...recent.spectra);
  current.molecules.push(...recent.molecules);
  return current;
}
