import fetch from 'cross-fetch';
import { FileCollectionItem } from 'filelist-utils';
import { convert } from 'jcampconverter';
import { Entry } from 'jcampconverter/lib/convert';
import { reimPhaseCorrection } from 'ml-spectra-processing';
import { NMRSignal1D, xyAutoRangesPicking } from 'nmr-processing';
import { getDiastereotopicAtomIDsFromMolfile } from 'openchemlib-utils';
import * as OCL from 'openchemlib/core';
import { Molecule } from 'openchemlib/core';

import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { JcampParsingOptions } from '../types/Options/JcampParsingOptions';
import { convertToFloatArray } from '../utilities/convertToFloatArray';
import { formatSpectra } from '../utilities/formatSpectra';
import generateID from '../utilities/generateID';
import { getInfoFromMeta } from '../utilities/getInfoFromMeta';
import { getIntegrationSum } from '../utilities/getIntegrationSum';
import { getNucleusFromMetadata } from '../utilities/getNucleusFromMetadata';
import {
  getPhaseParameters,
  hasPhaseParameters,
} from '../utilities/getPhaseParameters';

const expectedTypes = ['ndnmrspectrum', 'ndnmrfid', 'nmrspectrum', 'nmrfid'];

export async function readJcamp(
  file: FileCollectionItem,
  options: JcampParsingOptions = {},
): Promise<NmriumLikeObject> {
  const text = await file.text();
  return processJcamp(text, { name: file.name, ...options });
}

export function readJcampFromURL(
  jcampURL: string,
  options: JcampParsingOptions = {},
): Promise<NmriumLikeObject> {
  return fetch(jcampURL)
    .then((response) => response.text())
    .then((jcamp) =>
      processJcamp(jcamp, {
        ...{ source: { jcampURL } },
        ...options,
      }),
    );
}

interface SpectraData {
  molecules?: Array<{ id: string; molfile: string }>;
  molecule?: Molecule;
  assignments?: AssignmentData[];
}

export function processJcamp(text: string, options: JcampParsingOptions = {}) {
  let output: any = { spectra: [], molecules: [] };

  const {
    noContour = true,
    keepRecordsRegExp = /.*/,
    profiling = true,
  } = options;

  let parsedData = convert(text, {
    noContour,
    keepRecordsRegExp,
    profiling,
  });
  for (const entry of parsedData.entries) {
    const { children = [entry] } = entry as { children?: any };
    const spectraData: SpectraData = {};
    for (const child of children) {
      const { meta, dataClass = '', dataType = '' } = child;
      if (meta.MOLFILE) {
        if (!spectraData.molecules) spectraData.molecules = [];
        spectraData.molecules.push({
          id: generateID(),
          molfile: String(meta.MOLFILE),
        });
      }

      if (
        dataClass.toLowerCase().includes('assignments') &&
        dataType.toLowerCase().includes('assignments')
      ) {
        const { molecule, assignments } = getAssignmentObject(child, children);
        spectraData.assignments = assignments;
        spectraData.molecule = molecule;
      }

      if (!isSpectraData(child)) continue;

      if ((child.spectra && child.spectra.length > 0) || child.minMax) {
        let metadata = { ...child.info, ...child.meta };
        let info = getInfoFromMeta(metadata);
        if (info.experiment === 'wobble_curve') continue;

        const { dimension, originFrequency: frequency } = info;
        let dependentVariable: any = {};
        if (dimension === 1) {
          for (const spectrum of child.spectra) {
            spectrum.data = convertToFloatArray(spectrum.data);
          }
          dependentVariable.components = child.spectra;
        } else if (dimension === 2) {
          const newMinMax: Record<string, any> = info.isFid
            ? { re: child.minMax }
            : { rr: child.minMax };
          for (const key in newMinMax) {
            newMinMax[key].z = convertToFloatArray(
              child.minMax.z,
            ) as Float64Array[];
          }
          dependentVariable.components = newMinMax;
        }

        const { source = { file: { extension: 'jdx', binary: text } } } =
          options;
        const { name = info.title || `jcamp_${generateID()}` } = options;

        const spectrum: any = {
          dependentVariables: [dependentVariable],
          meta: metadata,
          info,
          source,
          display: { name },
        };

        if (dimension === 1) {
          const { assignments, molecule } = spectraData;

          const phaseParameters = getPhaseParameters(metadata);

          if (hasPhaseParameters(phaseParameters)) {
            const { ph0, ph1 } = phaseParameters;
            if (!('filters' in spectrum)) spectrum.filters = [];
            spectrum.filters.push({
              name: 'phaseCorrection',
              label: 'Phase correction',
              value: {
                ph0,
                ph1,
                absolute: false,
              },
              id: generateID(),
              flag: true,
              isDeleteAllow: true,
            });
          }

          if (assignments && molecule) {
            const integrationSum = getIntegrationSum(molecule, info);

            let { x, y } = child.spectra[0].data;
            if (x[0] > x[1]) {
              for (const spectrum of child.spectra) {
                spectrum.data.x.reverse();
                spectrum.data.y.reverse();
              }
            }

            if (
              hasPhaseParameters(phaseParameters) &&
              child.spectra.length > 1
            ) {
              const { ph0, ph1 } = phaseParameters;
              const { re } = reimPhaseCorrection(
                {
                  re: child.spectra[0].data.y,
                  im: child.spectra[1].data.y,
                },
                (ph0 * Math.PI) / 180,
                (ph1 * Math.PI) / 180,
              );
              y = re;
            }

            const ranges = xyAutoRangesPicking(
              { x, y },
              {
                peakPicking: { frequency },
                ranges: { frequency, integrationSum },
              },
            );

            assignments?.sort((a, b) => b.delta - a.delta);

            for (const range of ranges) {
              let currentIndex = 0;
              const { from, to } = range;
              const possibleAssignments = [];
              for (let i = currentIndex; i < assignments.length; i++) {
                const { delta } = assignments[i];
                if (delta <= to && delta >= from) {
                  possibleAssignments.push(assignments[i]);
                } else if (delta > to) {
                  currentIndex = i;
                }
              }
              if (possibleAssignments.length > 1) {
                const newSignals: NMRSignal1D[] = [];
                for (const assignment of possibleAssignments) {
                  const { delta, multiplicity, diaIDs } = assignment;
                  newSignals.push({
                    delta,
                    multiplicity,
                    diaIDs,
                  });
                }
                range.signals = newSignals;
              } else if (possibleAssignments.length > 0) {
                const { diaIDs } = possibleAssignments[0];
                const { signals = [{}] as NMRSignal1D[] } = range;
                signals[0] = { diaIDs, ...signals[0] };
                range.signals = signals;
              }
            }
            spectrum.ranges = {
              values: ranges.map((range) => {
                delete range.integration;
                return range;
              }),
              options: {
                sum: integrationSum,
                isSumConstant: true,
                sumAuto: true,
              },
            };
            if (spectraData.molecules) {
              const { id } = spectraData.molecules[0];
              spectrum.ranges.options.moleculeId = id;
            }
          }
        }
        if (spectraData.molecules) {
          output.molecules.push(...spectraData.molecules);
        }
        output.spectra.push(spectrum);
      }
    }
  }
  return formatSpectra(output);
}

interface AssignmentData {
  diaIDs: string[];
  delta: number;
  atoms: number[];
  intensity?: number;
  multiplicity?: string;
  width?: number;
  nbHydrogens: number;
}

function getAssignmentObject(
  child: any,
  children: any,
): { molecule?: Molecule; assignments?: AssignmentData[] } {
  const { spectra, info, meta } = child;
  const assignmentData = spectra[0].data;
  const assignments = [];
  const renameTable: Record<string, string> = {
    x: 'delta',
    y: 'intensity',
    w: 'width',
    m: 'multplicity',
    a: 'atom',
  };

  const { CROSSREFERENCE: crossReference } = info;
  const moleculeBlockID = parseInt(
    crossReference.toLowerCase().replace(/structure: block_id = (.*)/, '$1'),
  );

  if (moleculeBlockID < 1) return {};

  const { MOLFILE: molfile } = children[moleculeBlockID - 1].meta;
  const diaIDs = getDiastereotopicAtomIDsFromMolfile(OCL, molfile);

  const nucleus = getNucleusFromMetadata({ ...info, ...meta }, {}, '');
  for (let i = 0; i < assignmentData.x.length; i++) {
    const assignment: any = {};
    for (const key in assignmentData) {
      assignment[renameTable[key]] = assignmentData[key][i];
    }
    if ('atom' in assignment) {
      assignment.diaIDs = nucleus.includes('1H')
        ? diaIDs.map[assignment.atom - 1].hydrogenOCLIDs
        : [diaIDs.map[assignment.atom - 1].oclID];
      assignment.nbHydrogens = diaIDs.map[assignment.atom - 1].nbHydrogens;
    }
    assignments.push(assignment);
  }

  const joinedAssignment: Record<string, any> = {};
  for (const assignment of assignments) {
    const { delta, diaIDs } = assignment;
    const key = `${delta}_${diaIDs.join('_')}`;
    if (!joinedAssignment[key]) {
      const { atom, ...restAssignment } = assignment;
      joinedAssignment[key] = { ...restAssignment, atoms: [assignment.atom] };
    } else {
      joinedAssignment[key].atoms.push(assignment.atom);
    }
  }
  return {
    assignments: Object.values(joinedAssignment) as AssignmentData[],
    molecule: diaIDs.molecule,
  };
}

function isSpectraData(entry: Entry) {
  const { dataType = '', dataClass = '' } = entry;

  const inputDataType = dataType.replace(/\s/g, '').toLowerCase();
  const inputDataClass = dataClass.replace(/\s/g, '').toLowerCase();
  return (
    expectedTypes.some((type) => type === inputDataType) &&
    inputDataClass !== 'peaktable'
  );
}
