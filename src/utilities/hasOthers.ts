import { PartialFileList } from 'filelist-utils';

import { FILES_TYPES } from './files/constants';
import { getFileExtension } from './files/getFileExtension';

export function hasOthers(files: PartialFileList) {
  return files.some(
    (file) => FILES_TYPES[getFileExtension(file.name).toUpperCase()],
  );
}
