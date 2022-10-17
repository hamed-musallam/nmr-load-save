import { FileCollection } from 'filelist-utils';
import { fromBruker } from 'nmr-parser';

import { BrukerParsingOptions } from '../types/Options/BrukerParsingOptions';
import { Output } from '../types/Output';
import { formatSpectra } from '../utilities/formatSpectra';

import { UsedColors } from './UsedColors';

export async function readBruker(
  files: FileCollection,
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
    const { expno, name } = source;
    const display = { name: `${name}/${expno}` };
    output.spectra.push({ dependentVariables, meta, info, source, display });
  }

  return formatSpectra(output, usedColors);
}
