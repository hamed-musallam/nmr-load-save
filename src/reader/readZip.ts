import { fileCollectionFromZip, FileCollectionItem } from 'filelist-utils';

import type { NmriumLikeObject } from '../types/NmriumLikeObject';
import type { ParsingOptions } from '../types/Options/ParsingOptions';

import { read } from './read';

export async function readZipFile(
  file: FileCollectionItem,
  options: ParsingOptions = {},
): Promise<NmriumLikeObject> {
  const filecollection = await fileCollectionFromZip(await file.arrayBuffer());
  return read(filecollection, options);
}
