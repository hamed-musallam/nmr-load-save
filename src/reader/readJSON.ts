import { migrate } from '../migration/MigrationManager';
import { JcampParsingOptions } from '../types/Options/JcampParsingOptions';
import type { Options } from '../types/Options/Options';
import type { Output } from '../types/Output';
import { formatSpectrum1D } from '../utilities/formatSpectrum1D';
import { formatSpectrum2D } from '../utilities/formatSpectrum2D';

import { UsedColors } from './UsedColors';
import { readJcampFromURL } from './readJcamp';

type Text = string;

export async function readJSON(
  text: Text,
  usedColors: UsedColors,
  options: Options = {},
): Promise<Output> {
  let output: any = { spectra: [], molecules: [] };

  const parsedData = JSON.parse(text.toString());
  const data = migrate(parsedData);

  const spectra = output.spectra;
  let promises = [];

  for (let datum of data.spectra) {
    if (datum.source.jcampURL != null) {
      const { jcampParsingOptions } = options;
      promises.push(
        addJcampFromURL(spectra, usedColors, {
          jcampURL: datum.source.jcampURL,
          datum,
          jcampParsingOptions,
        }),
      );
    } else {
      const { dimension } = datum.info;
      if (dimension === 1) {
        spectra.push(formatSpectrum1D(datum, usedColors));
      } else if (dimension === 2) {
        spectra.push(formatSpectrum2D(datum, usedColors));
      }
    }
  }
  await Promise.all(promises);
  return { ...data, ...{ spectra } };
}

async function addJcampFromURL(
  spectra: any,
  usedColors: UsedColors,
  options: {
    jcampURL: string;
    datum: any;
    jcampParsingOptions?: JcampParsingOptions;
  },
) {
  const { jcampURL, datum, jcampParsingOptions } = options;
  const result = await readJcampFromURL(
    jcampURL,
    usedColors,
    jcampParsingOptions,
  );
  if (result) {
    for (let spectrum of result.spectra) {
      spectra.push({ ...spectrum, ...datum });
    }
  }
}
