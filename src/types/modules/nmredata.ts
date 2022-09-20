declare module 'nmredata' {
  import { PartialFileList } from 'filelist-utils';
  import { Molecule } from 'openchemlib';

  function nmrRecordToJSON(options: {
    sdf: SdfData;
    files: PartialFileList;
    molecule?: Molecule;
  }): any;

  interface ParsedSDF {
    time: number;
    molecules: Array<Record<string, string>>;
    labels: string[];
    statistics: any[];
  }

  function parseSDF(sdf: string, options: any): ParsedSDF;

  interface SdfData extends ParsedSDF {
    filename: string;
    root: string;
  }
  function getSDF(files: PartialFileList): Promise<SdfData[]>;
}
