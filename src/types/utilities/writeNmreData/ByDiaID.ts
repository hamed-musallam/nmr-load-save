interface DiaID {
  [index: string]: string | number | Array<number>;
  label: string;
  atoms: Array<number>;
  shift: number;
}

export type ByDiaID = Record<string, DiaID>;
