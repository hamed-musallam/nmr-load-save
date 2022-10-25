import {
  FileCollection,
  fileCollectionFromZip,
  FileCollectionItem,
} from 'filelist-utils';

import type { NmriumLikeObject } from '../types/NmriumLikeObject';
import type { ParsingOptions } from '../types/Options/ParsingOptions';
import { FILES_TYPES } from '../utilities/files/constants';
import { getFileExtension } from '../utilities/files/getFileExtension';
import { hasBruker } from '../utilities/hasBruker';
import { hasOthers } from '../utilities/hasOthers';

import { read } from './read';
import { readBruker } from './readBruker';

export async function readZipFile(
  file: FileCollectionItem,
  options: ParsingOptions = {},
): Promise<NmriumLikeObject> {
  return readZip(await file.arrayBuffer(), options);
}

export async function readZip(
  zipBuffer: ArrayBuffer,
  options: ParsingOptions = {},
) {
  const fileCollection = await fileCollectionFromZip(zipBuffer);
  let result: NmriumLikeObject = { spectra: [], molecules: [] };

  if (hasBruker(fileCollection)) {
    const { brukerParsingOptions } = options;
    let partialResult: NmriumLikeObject = await readBruker(fileCollection, {
      ...brukerParsingOptions,
    });
    if (partialResult.spectra) result.spectra.push(...partialResult.spectra);
  }

  if (hasOthers(fileCollection)) {
    const residualFiles = fileCollection.files.filter(
      (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
    );
    const newFileCollection = new FileCollection(residualFiles);
    let partialResult: NmriumLikeObject = await read(
      newFileCollection,
      options,
    );
    result.spectra.push(...partialResult.spectra);
    result.molecules.push(...partialResult.molecules);
  }

  return result;
}
