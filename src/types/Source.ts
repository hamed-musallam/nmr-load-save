import { FileCollection } from 'filelist-utils';

export interface Source {
  jcampURL?: string;
  file?: {
    name: string;
    type: string;
    fileCollection: FileCollection;
  };
}
