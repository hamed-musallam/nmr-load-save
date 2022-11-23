import {
  convertFileCollection,
  SpectraData,
  SpectraData2D,
} from 'brukerconverter';
import { FileCollection } from 'filelist-utils';

import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { BrukerParsingOptions } from '../types/Options/BrukerParsingOptions';
import { convertToFloatArray } from '../utilities/convertToFloatArray';
import { formatSpectra } from '../utilities/formatSpectra';
import { getInfoFromMeta } from '../utilities/getInfoFromMeta';

const defaultOptions = {
  converter: {
    xy: true,
    noContour: true,
    keepRecordsRegExp: /.*/,
    profiling: true,
  },
};

export async function readBruker(
  fileCollection: FileCollection,
  options: BrukerParsingOptions = {},
): Promise<NmriumLikeObject> {
  let output: any = { spectra: [], molecules: [] };

  let parseData = await convertFileCollection(fileCollection, {
    ...defaultOptions,
    ...options,
  });

  for (let entry of parseData) {
    let metadata = { ...entry.info, ...entry.meta };
    let info = getInfoFromMeta(metadata);
    let dependentVariable: any = {};

    if (isTwoD(entry)) {
      const minMax = entry.minMax;
      for (const key in minMax) {
        const minMaxContent = minMax[key];
        minMaxContent.z = convertToFloatArray(
          minMaxContent.z,
        ) as Float64Array[];
      }
      dependentVariable.components = entry.minMax;
    } else if (info.dimension === 1) {
      dependentVariable.components = entry.spectra;
    }

    const { source } = entry;
    const { expno, name } = source;
    const display = { name: `${name}/${expno}` };
    output.spectra.push({
      dependentVariables: [dependentVariable],
      meta: metadata,
      info,
      source,
      display,
    });
  }

  return formatSpectra(output);
}

function isTwoD(entry: SpectraData): entry is SpectraData2D {
  const { info } = entry;
  return info.dimension === 2;
}
