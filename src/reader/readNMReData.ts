import { fileCollectionFromZip, FileCollectionItem } from 'filelist-utils';
import { nmrRecordToJSON, getSDF } from 'nmredata';

import { NmredataParsingOptions } from '../types/Options/NmredataParsingOptions';
import { Output } from '../types/Output';
import { Source } from '../types/Source';
import { isSpectrum2D } from '../utilities/tools/isSpectrum2D';
import { addRanges } from '../utilities/tools/nmredata/addRanges';
import { addZones } from '../utilities/tools/nmredata/addZones';

import { readBruker } from './readBruker';
import { readJcamp, readJcampFromURL } from './readJcamp';

export async function readNMReData(
  file: FileCollectionItem,
  options: NmredataParsingOptions = {},
) {
  const fileCollection = await fileCollectionFromZip(await file.arrayBuffer());
  const sdfFiles = await getSDF(fileCollection);

  const jsonData = await nmrRecordToJSON({ sdf: sdfFiles[0], fileCollection });

  let { spectra, molecules = [] } = jsonData;

  let nmrium: Output = {
    spectra: [],
    molecules,
  };

  for (const data of spectra) {
    let { spectra: internalSpectra } = await getSpectra(data.source, options);
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
  options: NmredataParsingOptions = {},
) {
  const { file, jcampURL } = source;
  const { brukerParsingOptions, jcampParsingOptions } = options;

  if (jcampURL) {
    return readJcampFromURL(jcampURL, {
      name: file?.fileCollection.files[0].name,
      ...{ xy: true, noContours: true },
      ...jcampParsingOptions,
    });
  }

  if (!file) return { spectra: [], molecules: [] };

  switch (file.type) {
    case 'jcamp':
      return readJcamp(file.fileCollection.files[0], {
        name: file?.fileCollection.files[0].name,
        ...{ xy: true, noContours: true },
        ...jcampParsingOptions,
      });
    case 'brukerFiles':
      return readBruker(file.fileCollection, {
        ...{ xy: true, noContours: true },
        ...brukerParsingOptions,
      });
    default:
      throw new Error('There is not a supported source');
  }
}
