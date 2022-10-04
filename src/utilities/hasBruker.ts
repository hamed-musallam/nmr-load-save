import { FileCollection } from 'filelist-utils';

export function hasBruker(fileCollection: FileCollection) {
  return fileCollection.files.some((file) =>
    ['2rr', 'fid', '1r'].some((brukerFile) => file.name.endsWith(brukerFile)),
  );
}
