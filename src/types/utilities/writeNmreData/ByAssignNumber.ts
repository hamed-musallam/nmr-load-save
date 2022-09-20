interface DiaID {
  label: string;
  diaID: string;
  shift: number;
}

export type ByAssignNumber = Record<string, DiaID>;
