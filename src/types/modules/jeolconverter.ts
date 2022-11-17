declare module 'jeolconverter' {
  interface UnitMagnitude {
    magnitude: number;
    unit: string;
  }
  interface InfoFromJeol {
    nucleus: string[];
    author: string;
    creationTime: UnitMagnitude;
    sampleName: string;
    temperature: UnitMagnitude;
    solvent: string;
    probeName: string;
    fieldStrength: UnitMagnitude;
    experiment: string;
    digitalFilter: number;
    pulseStrength90: UnitMagnitude;
    numberOfScans: number;
    relaxationTime: UnitMagnitude;
    dataSections: string[];
    dataUnits: string[];
    dimension: number;
    originFrequency: UnitMagnitude[];
    dataPoints: number[];
    frequencyOffset: UnitMagnitude[];
    acquisitionTime: UnitMagnitude[];
    spectralWidth: UnitMagnitude[];
    dataOffsetStart: number[];
    dataOffsetStop: number[];
    spectralWidthClipped: UnitMagnitude[];
    dataAxisStop: number[];
  }
  function parseJEOL(buffer: ArrayBuffer): {
    info: InfoFromJeol;
    headers: any;
    parameters: any;
    data: any;
  };
}
