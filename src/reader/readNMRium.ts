import { FileCollectionItem } from 'filelist-utils';
import { Options } from 'nmr-parser';

import { FILES_SIGNATURES } from '../utilities/files/constants';

import { UsedColors } from './UsedColors';
import { readNMRiumObject } from './readNMRiumObject';
import { readZip } from './readZip';

export async function readNMRium(
  file: FileCollectionItem,
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
    const decoded = decoder.decode(buffer);
    const nmriumData = JSON.parse(decoded.toString());
    return readNMRiumObject(nmriumData, usedColors);
  }
}
