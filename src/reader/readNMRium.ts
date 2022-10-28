import { fileCollectionFromZip, FileCollectionItem } from 'filelist-utils';

import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { ParsingOptions } from '../types/Options/ParsingOptions';

import { readNMRiumObject } from './readNMRiumObject';

export async function readNMRium(
  file: FileCollectionItem,
  options: Partial<ParsingOptions>,
): Promise<NmriumLikeObject> {
  const buffer = await file.arrayBuffer();
  const nmriumLikeText = await (isZip(buffer) ? getText(buffer) : file.text());
  return readNMRiumObject(JSON.parse(nmriumLikeText), options);
}

async function getText(buffer: ArrayBuffer) {
  const fileCollection = await fileCollectionFromZip(buffer);
  if (fileCollection.files.length < 1) {
    throw new Error(`compressed nmrium file is corrupted`);
  }
  return fileCollection.files[0].text();
}

function isZip(buffer: ArrayBuffer) {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);

  return (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)
  );
}
