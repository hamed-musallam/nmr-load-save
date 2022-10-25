import fetch from 'cross-fetch';
import { FileCollectionItem } from 'filelist-utils';
import { fromJCAMP } from 'nmr-parser';

import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { JcampParsingOptions } from '../types/Options/JcampParsingOptions';
import { formatSpectra } from '../utilities/formatSpectra';
import generateID from '../utilities/generateID';

export async function readJcamp(
  file: FileCollectionItem,
  options: JcampParsingOptions = {},
): Promise<NmriumLikeObject> {
  const text = await file.text();
  return processJcamp(text, { name: file.name, ...options });
}

export function readJcampFromURL(
  jcampURL: string,
  options: JcampParsingOptions = {},
): Promise<NmriumLikeObject> {
  return fetch(jcampURL)
    .then((response) => response.text())
    .then((jcamp) =>
      processJcamp(jcamp, {
        ...{ source: { jcampURL } },
        ...options,
      }),
    );
}

export function processJcamp(text: string, options: JcampParsingOptions = {}) {
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
    output.spectra.push({
      dependentVariables,
      meta,
      info,
      source,
      display: { name },
    });
  }

  return formatSpectra(output);
}
