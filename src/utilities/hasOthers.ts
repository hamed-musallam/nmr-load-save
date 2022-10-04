import { FileCollection } from 'filelist-utils';

import { FILES_TYPES } from './files/constants';
import { getFileExtension } from './files/getFileExtension';

export function hasOthers(fileCollection: FileCollection) {
  return fileCollection.files.some(
    (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
  );
}
