import { PartialFile, PartialFileList } from 'filelist-utils';

import type { Options } from '../types/Options/Options';
import type { Output } from '../types/Output';
import { FILES_TYPES, FILES_SIGNATURES } from '../utilities/files/constants';
import { getFileExtension } from '../utilities/files/getFileExtension';
import { hasBruker } from '../utilities/hasBruker';
import { hasOthers } from '../utilities/hasOthers';

import { UsedColors } from './UsedColors';
import { readBruker } from './readBruker';
import { readJDF } from './readJDF';
import { readJSON } from './readJSON';
import { readJcamp } from './readJcamp';
import { readNMReData } from './readNMReData';
import { readZip, readZipFile } from './readZip';

/**
 * read nmr data based on the file extension.
 * @param files - List of objects.
 * @param options - options for each kind of processor.
 * @returns
 */

function ensurePartialFileList<T extends PartialFile | PartialFileList>(
  files: T,
): PartialFileList {
  return !Array.isArray(files) ? [files] : files;
}

export async function read(
  input: PartialFile | PartialFileList,
  usedColors: UsedColors = { '1d': [], '2d': [] },
  options: Partial<Options> = {},
): Promise<Output> {
  let result: Output = { spectra: [], molecules: [] };

  const files = ensurePartialFileList(input);

  if (hasBruker(files)) {
    const { brukerParsingOptions } = options;
    let partialResult: Output = await readBruker(files, usedColors, {
      ...brukerParsingOptions,
    });
    if (partialResult.spectra) result.spectra.push(...partialResult.spectra);
  }

  const residualFiles = hasOthers(files)
    ? files.filter(
        (file: PartialFile) =>
          FILES_TYPES[getFileExtension(file.name).toUpperCase()],
      )
    : ([] as PartialFileList);

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
  file: PartialFile,
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
      return processJSON(file, usedColors, options);
    default:
      throw new Error(`The extension ${extension} is not supported`);
  }
}

async function processJSON(
  file: PartialFile,
  usedColors: UsedColors,
  options: Partial<Options>,
) {
  const buffer = await file.arrayBuffer();
  const fileSignature = new Uint8Array(buffer)
    .slice(0, 4)
    .reduce((acc, byte) => (acc += byte.toString(16).padStart(2, '0')), '');

  if (fileSignature === FILES_SIGNATURES.ZIP) {
    return readZip(buffer, usedColors, options);
  } else {
    const decoder = new TextDecoder('utf8');
    return readJSON(decoder.decode(buffer), usedColors);
  }
}
