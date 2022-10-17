import { FileCollection, FileCollectionItem } from 'filelist-utils';
import { isAnyArray } from 'is-any-array';

import type { Options } from '../types/Options/Options';
import type { Output } from '../types/Output';
import { FILES_TYPES } from '../utilities/files/constants';
import { getFileExtension } from '../utilities/files/getFileExtension';
import { hasBruker } from '../utilities/hasBruker';
import { hasOthers } from '../utilities/hasOthers';

import { UsedColors } from './UsedColors';
import { readBruker } from './readBruker';
import { readJDF } from './readJDF';
import { readJcamp } from './readJcamp';
import { readNMReData } from './readNMReData';
import { readZipFile } from './readZip';
import { readNMRium } from './readNMRium';

/**
 * read nmr data based on the file extension.
 * @param files - List of objects.
 * @param options - options for each kind of processor.
 * @returns
 */

function ensureFileCollection<T extends FileCollectionItem | FileCollection>(
  input: T,
): FileCollection {
  if (isAnyArray(input)) {
    throw new Error(
      'For a set of fileCollectionItems pass a FileCollection instance',
    );
  }
  return isFileCollection(input) ? input : new FileCollection([input]);
}

function isFileCollection(
  input: FileCollectionItem | FileCollection,
): input is FileCollection {
  return typeof input === 'object' && 'files' in input;
}

export async function read(
  input: FileCollection | FileCollectionItem,
  usedColors: UsedColors = { '1d': [], '2d': [] },
  options: Partial<Options> = {},
): Promise<Output> {
  let result: Output = { spectra: [], molecules: [] };

  const fileCollection = ensureFileCollection(input);

  if (hasBruker(fileCollection)) {
    const { brukerParsingOptions } = options;
    let partialResult: Output = await readBruker(fileCollection, usedColors, {
      ...brukerParsingOptions,
    });
    if (partialResult.spectra) result.spectra.push(...partialResult.spectra);
  }

  const residualFiles = hasOthers(fileCollection)
    ? fileCollection.files.filter(
        (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
      )
    : ([] as FileCollectionItem[]);

  for (let file of residualFiles) {
    const { spectra = [], molecules = [] } = await process(
      file,
      usedColors,
      options,
    );
    result.spectra.push(...spectra);
    result.molecules.push(...molecules);
  }
  return result;
}

async function process(
  file: FileCollectionItem,
  usedColors: UsedColors,
  options: Partial<Options>,
): Promise<Output> {
  const { jcampParsingOptions } = options;
  const extension = getFileExtension(file.name);
  switch (extension) {
    case FILES_TYPES.MOL:
      return { molecules: [{ molfile: await file.text() }], spectra: [] };
    case FILES_TYPES.JDX:
    case FILES_TYPES.DX:
    case FILES_TYPES.JCAMP:
      return readJcamp(file, usedColors, jcampParsingOptions);
    case FILES_TYPES.JDF:
      return readJDF(file, usedColors, { name: file.name });
    case FILES_TYPES.ZIP:
      return readZipFile(file, usedColors, options);
    case FILES_TYPES.NMREDATA:
      return readNMReData(file, usedColors, options);
    case FILES_TYPES.NMRIUM:
    case FILES_TYPES.JSON:
      return readNMRium(file, usedColors, options);
    default:
      throw new Error(`The extension ${extension} is not supported`);
  }
}
