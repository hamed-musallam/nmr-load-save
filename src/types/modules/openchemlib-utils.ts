interface DiaID {
  [index: string]: number | string | number[];
  counter: number;
  atoms: number[];
  oclID: string;
  atomLabel: string;
}

type GroupedDiastereotopicAtomIDs = DiaID[];

interface GetShortestPathsOptions {
  toLabel: string;
  maxLength: number;
}

interface DiaIDMapped extends DiaID {
  source: number;
  destination: number;
}

interface DiaIDsAndH {
  oclID: string;
  hydrogenOCLIDs: string[];
  nbHydrogens: number;
}

declare module 'openchemlib-utils' {
  import type { Molecule, Molecule as OCLMolecule } from 'openchemlib/full';

  function getShortestPaths(
    molecule: OCLMolecule,
    options: GetShortestPathsOptions,
  ): number[][][];

  function getGroupedDiastereotopicAtomIDs(
    molecule: OCLMolecule,
  ): GroupedDiastereotopicAtomIDs;

  function getDiastereotopicAtomIDsFromMolfile(
    OCL: any,
    molfile: string,
  ): { map: DiaIDMapped[]; molecule: Molecule; diaIDs: DiaIDsAndH[] };
}
