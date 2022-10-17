import { FileCollectionItem } from 'filelist-utils';
import { fromJEOL } from 'nmr-parser';

import type { Data1D } from '../types/Data1D';
import type { Data2D } from '../types/Data2D';
import type { Options } from '../types/Options/Options';
import { formatSpectra } from '../utilities/formatSpectra';

import { UsedColors } from './UsedColors';

export async function readJDF(
  file: FileCollectionItem,
  usedColors: UsedColors,
  options: Options,
) {
  const jdf = await file.arrayBuffer();
  const { name = file.name } = options;
  let output: any = { spectra: [], molecules: [] };

  const jeolData = fromJEOL(jdf);
  const converted = jeolData[0];
  let info = converted.description;
  let metadata = info.metadata;
  const acquisitionMode = 0;
  const experiment = info.dimension === 1 ? '1d' : '2d';
  const type = 'NMR SPECTRUM';
  const nucleus = info.dimension === 1 ? info.nucleus[0] : info.nucleus;
  const numberOfPoints = info.numberOfPoints;
  const acquisitionTime = info.acquisitionTime;

  const baseFrequency = info.baseFrequency;
  const frequencyOffset = info.frequencyOffset;

  const spectralWidthClipped = converted.application.spectralWidthClipped;
  let data;
  if (converted.dependentVariables) {
    if (info.dimension === 1) {
      data = format1D(converted);
    } else if (info.dimension === 2) {
      data = format2D(converted);
    }
  }
  output.spectra = [
    {
      data,
      info: {
        ...info,
        ...{
          acquisitionMode,
          experiment,
          type,
          nucleus,
          numberOfPoints,
          acquisitionTime,
          baseFrequency,
          frequencyOffset,
          spectralWidthClipped,
        },
      },
      meta: metadata,
      display: {
        name,
      },
      source: {
        name,
        extension: 'jdf',
        binary: jdf,
      },
      ...options,
    },
  ];
  return formatSpectra(output, usedColors);
}

function format1D(result: any): Data1D {
  let dimension = result.dimensions[0];
  let dependentVariables = result.dependentVariables;

  let quantityName = dimension.quantityName;
  let n = dimension.count;
  let incr = dimension.increment.magnitude;
  let origin = dimension.originOffset.magnitude;
  let offset = dimension.coordinatesOffset.magnitude;

  let buffer = dependentVariables[0].components[0];
  const re = new Float64Array(n);
  const im = new Float64Array(n);

  for (let i = buffer.length - 1, index = 0; i > 0; i -= 2) {
    re[index] = buffer[i - 1];
    im[index++] = buffer[i];
  }

  let data: any = {};
  let [i, x0] = [0, 0];
  switch (quantityName) {
    case 'frequency':
      x0 = 0 + (offset / origin) * 1000000;
      i = (incr / origin) * 1000000;
      data.re = re;
      data.im = im;
      break;
    case 'time':
      x0 = origin;
      i = incr;
      data.re = re.reverse();
      data.im = im.reverse().map((z) => -z);
      break;
    default:
      break;
  }

  let scale: number[] = [];
  for (let x = 0; x < n; x++) {
    scale.push(x0 + x * i);
  }

  data.x = scale;
  return data;
}

function format2D(result: any): Data2D {
  let dimensions = result.dimensions;
  let dependentVariables = result.dependentVariables;
  let quantityName = dimensions[0].quantityName;
  let reBuffer = [];
  let imBuffer = [];
  let maxZ = Number.MIN_SAFE_INTEGER;
  let minZ = Number.MAX_SAFE_INTEGER;
  for (const buffer of dependentVariables[0].components) {
    let re = new Float64Array(buffer.length / 2);
    let im = new Float64Array(buffer.length / 2);
    for (let i = buffer.length - 1, index = 0; i > 0; i -= 2) {
      let realValue = buffer[i - 1];
      if (realValue > maxZ) maxZ = realValue;
      if (realValue < minZ) minZ = realValue;
      re[index] = realValue;
      im[index++] = buffer[i];
    }

    if (quantityName === 'frequency') {
      reBuffer.push(re);
      imBuffer.push(im);
    } else {
      const len = re.length;
      let newIm = new Float64Array(im.length);
      for (let i = 0, j = len - 1; i < len; i++) {
        newIm[i] = -im[j--];
      }
      reBuffer.push(re.reverse());
      imBuffer.push(newIm);
    }
  }

  let data: any = {
    z: reBuffer,
    minZ,
    maxZ,
  };
  const axis = ['X', 'Y'];
  for (let i = 0; i < axis.length; i++) {
    let n = dimensions[i].count;
    let incr = dimensions[i].increment.magnitude;
    let origin = dimensions[i].originOffset.magnitude;
    let offset = dimensions[i].coordinatesOffset.magnitude;

    const axe = axis[i];
    if (quantityName === 'frequency') {
      data[`min${axe}`] = 0 + (offset / origin) * 1000000;
      data[`max${axe}`] = n * (incr / origin) * 1000000;
    } else {
      data[`min${axe}`] = origin;
      data[`max${axe}`] = n * incr;
    }
  }

  return data;
}
