export interface PhaseParameters {
  ph0: number;
  ph1: number;
}

export function getPhaseParameters(metadata: any) {
  const result: Partial<PhaseParameters> = { ph0: undefined, ph1: undefined };

  if ('.PHASE0' in metadata) {
    result.ph0 = parseFloat(metadata['.PHASE0']);
    result.ph1 = parseFloat(metadata['.PHASE1']);
  }

  return result;
}

export function hasPhaseParameters(
  phaseParameters: Partial<PhaseParameters>,
): phaseParameters is PhaseParameters {
  const { ph0, ph1 } = phaseParameters;
  return ph0 !== undefined && ph1 !== undefined;
}
