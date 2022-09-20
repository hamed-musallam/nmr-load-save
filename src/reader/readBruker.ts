import { PartialFileList } from 'filelist-utils';
import { fromBruker } from 'nmr-parser';

import { BrukerParsingOptions } from '../types/Options/BrukerParsingOptions';
import { Output } from '../types/Output';
import { formatSpectra } from '../utilities/formatSpectra';

import { UsedColors } from './UsedColors';

export async function readBruker(
  files: PartialFileList,
  usedColors: UsedColors,
  options: BrukerParsingOptions = {},
): Promise<Output> {
  let output: any = { spectra: [], molecules: [] };

  const entries = await fromBruker(files, {
    ...{
      noContour: true,
      xy: true,
      keepRecordsRegExp: /.*/,
      profiling: true,
    },
    ...options,
  });

  for (let entry of entries) {
    const { dependentVariables, info, meta, source } = entry;
    output.spectra.push({ dependentVariables, meta, info, source });
  }

  return formatSpectra(output, usedColors);
}
