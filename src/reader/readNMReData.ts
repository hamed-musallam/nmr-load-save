import { fileListFromZip, PartialFile } from 'filelist-utils';
import { nmrRecordToJSON, getSDF } from 'nmredata';

import { NmredataParsingOptions } from '../types/Options/NmredataParsingOptions';
import { Output } from '../types/Output';
import { Source } from '../types/Source';
import { isSpectrum2D } from '../utilities/tools/isSpectrum2D';
import { addRanges } from '../utilities/tools/nmredata/addRanges';
import { addZones } from '../utilities/tools/nmredata/addZones';

import { UsedColors } from './UsedColors';
import { readBruker } from './readBruker';
import { readJcamp, readJcampFromURL } from './readJcamp';

export async function readNMReData(
  file: PartialFile,
  usedColors: UsedColors,
  options: NmredataParsingOptions = {},
) {
  const files = await fileListFromZip(await file.arrayBuffer());
  const sdfFiles = await getSDF(files);

  const jsonData = await nmrRecordToJSON({ sdf: sdfFiles[0], files });

  let { spectra, molecules = [] } = jsonData;

  let nmrium: Output = {
    spectra: [],
    molecules,
  };

  for (const data of spectra) {
    let { spectra: internalSpectra } = await getSpectra(
      data.source,
      usedColors,
      options,
    );
    for (const spectrum of internalSpectra) {
      const { info } = spectrum;

      if (info.isFid) continue;

      if (isSpectrum2D(spectrum)) {
        addZones(data.signals, spectrum);
      } else {
        addRanges(data.signals, spectrum);
      }
    }
    nmrium.spectra.push(...internalSpectra);
  }
  return nmrium;
}

async function getSpectra(
  source: Source,
  usedColors: UsedColors,
  options: NmredataParsingOptions = {},
) {
  const { file, jcampURL } = source;
  const { brukerParsingOptions, jcampParsingOptions } = options;

  if (jcampURL) {
    return readJcampFromURL(jcampURL, usedColors, {
      ...{ xy: true, noContours: true },
      ...jcampParsingOptions,
    });
  }

  if (!file) return { spectra: [], molecules: [] };

  switch (file.type) {
    case 'jcamp':
      return readJcamp(file.files[0], usedColors, {
        ...{ xy: true, noContours: true },
        ...jcampParsingOptions,
      });
    case 'brukerFiles':
      return readBruker(file.files, usedColors, {
        ...{ xy: true, noContours: true, keepOriginal: true },
        ...brukerParsingOptions,
      });
    default:
      throw new Error('There is not a supported source');
  }
}
