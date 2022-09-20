import { PartialFileList } from 'filelist-utils';

export interface Source {
  jcampURL?: string;
  file?: {
    name: string;
    type: string;
    files: PartialFileList;
  };
}
