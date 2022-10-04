import {
  FileCollection,
  fileCollectionFromZip,
  FileCollectionItem,
} from 'filelist-utils';

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
  file: FileCollectionItem,
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
  const fileCollection = await fileCollectionFromZip(zipBuffer);
  let result: Output = { spectra: [], molecules: [] };

  if (hasBruker(fileCollection)) {
    const { brukerParsingOptions } = options;
    let partialResult: Output = await readBruker(fileCollection, usedColors, {
      ...brukerParsingOptions,
    });
    if (partialResult.spectra) result.spectra.push(...partialResult.spectra);
  }

  if (hasOthers(fileCollection)) {
    const residualFiles = fileCollection.files.filter(
      (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
    );
    const newFileCollection = new FileCollection(residualFiles);
    let partialResult: Output = await read(
      newFileCollection,
      usedColors,
      options,
    );
    result.spectra.push(...partialResult.spectra);
    result.molecules.push(...partialResult.molecules);
  }

  return result;
}
