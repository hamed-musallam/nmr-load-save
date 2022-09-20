import { PartialFileList } from 'filelist-utils';

export function hasBruker(files: PartialFileList) {
  return files.some((file) =>
    ['2rr', 'fid', '1r'].some((brukerFile) => file.name.endsWith(brukerFile)),
  );
}
