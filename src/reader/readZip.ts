import { fileListFromZip, PartialFile } from 'filelist-utils';

import type { Options } from '../types/Options/Options';
import type { Output } from '../types/Output';
import { FILES_TYPES } from '../utilities/files/constants';
import { getFileExtension } from '../utilities/files/getFileExtension';
import { hasBruker } from '../utilities/hasBruker';
import { hasOthers } from '../utilities/hasOthers';

import { UsedColors } from './UsedColors';
import { read } from './read';
import { readBruker } from './readBruker';

export async function readZipFile(
  file: PartialFile,
  usedColors: UsedColors,
  options: Options = {},
): Promise<Output> {
  return readZip(await file.arrayBuffer(), usedColors, options);
}

export async function readZip(
  zipBuffer: ArrayBuffer,
  usedColors: UsedColors,
  options: Options = {},
) {
  const files = await fileListFromZip(zipBuffer);
  let result: Output = { spectra: [], molecules: [] };

  if (hasBruker(files)) {
    const { brukerParsingOptions } = options;
    let partialResult: Output = await readBruker(files, usedColors, {
      ...brukerParsingOptions,
    });
    if (partialResult.spectra) result.spectra.push(...partialResult.spectra);
  }

  if (hasOthers(files)) {
    const residualFiles = files.filter(
      (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
    );
    let partialResult: Output = await read(residualFiles, usedColors, options);
    result.spectra.push(...partialResult.spectra);
    result.molecules.push(...partialResult.molecules);
  }

  return result;
}
