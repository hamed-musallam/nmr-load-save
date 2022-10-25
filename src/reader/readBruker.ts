import { FileCollection } from 'filelist-utils';
import { fromBruker } from 'nmr-parser';

import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { BrukerParsingOptions } from '../types/Options/BrukerParsingOptions';
import { formatSpectra } from '../utilities/formatSpectra';

export async function readBruker(
  files: FileCollection,
  options: BrukerParsingOptions = {},
): Promise<NmriumLikeObject> {
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

  return formatSpectra(output);
}
