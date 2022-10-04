import fetch from 'cross-fetch';
import { FileCollectionItem } from 'filelist-utils';
import { fromJCAMP } from 'nmr-parser';

import { JcampParsingOptions } from '../types/Options/JcampParsingOptions';
import { Output } from '../types/Output';
import { formatSpectra } from '../utilities/formatSpectra';
import generateID from '../utilities/generateID';

import { UsedColors } from './UsedColors';

export async function readJcamp(
  file: FileCollectionItem,
  usedColors: UsedColors,
  options: JcampParsingOptions = {},
): Promise<Output> {
  const text = await file.text();
  return processJcamp(text, usedColors, options);
}

export function readJcampFromURL(
  jcampURL: string,
  usedColors: UsedColors,
  options: JcampParsingOptions = {},
): Promise<Output> {
  return fetch(jcampURL)
    .then((response) => response.text())
    .then((jcamp) =>
      processJcamp(jcamp, usedColors, {
        ...{ source: { jcampURL } },
        ...options,
      }),
    );
}

function processJcamp(
  text: string,
  usedColors: UsedColors,
  options: JcampParsingOptions = {},
) {
  let output: any = { spectra: [], molecules: [] };

  let entries = fromJCAMP(text, {
    ...{
      noContour: true,
      xy: true,
      keepRecordsRegExp: /.*/,
      profiling: true,
    },
    ...options,
  });

  const { name = `jcamp${generateID()}` } = options;
  const { source = { file: { name, extension: 'jdx', binary: text } } } =
    options;
  for (let entry of entries) {
    const { dependentVariables, info, meta } = entry;
    output.spectra.push({ dependentVariables, meta, info, source });
  }

  return formatSpectra(output, usedColors);
}
