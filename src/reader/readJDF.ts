import { FileCollectionItem } from 'filelist-utils';
import { parseJEOL } from 'jeolconverter';
import merge from 'lodash.merge';
import { gyromagneticRatio, Nuclei } from 'nmr-processing';

import type { Data1D } from '../types/Data1D';
import type { Data2D } from '../types/Data2D';
import type { ParsingOptions } from '../types/Options/ParsingOptions';
import { formatSpectra } from '../utilities/formatSpectra';
import { formatDependentVariable } from '../utilities/jeolFormater/formatDependentVariable';

export async function readJDF(
  file: FileCollectionItem,
  options: ParsingOptions,
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

  const spectralWidthClipped = info.spectralWidthClipped[0];
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
  return formatSpectra(output);
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

function fromJEOL(buffer: ArrayBuffer) {
  let parsedData = parseJEOL(buffer);
  let info = parsedData.info;
  let headers = parsedData.headers;
  let parameters = parsedData.parameters;
  let paramArray = { ...parameters.paramArray };
  delete parameters.paramArray;
  let data = parsedData.data;

  // curation of parameters
  let newInfo: Record<string, any> = {};
  newInfo.title = `title: ${headers.title} / comment: ${headers.comment} / author:${headers.author} / site: ${headers.site}`;
  newInfo.nucleus = info.nucleus.map((x) => {
    if (x === 'Proton') {
      x = '1H';
    }
    if (x === 'Carbon13') {
      x = '13C';
    }
    if (x === 'Nitrogen15') {
      x = '15N';
    }
    return x;
  });
  newInfo.sampleName = info.sampleName;
  newInfo.date = JSON.stringify(info.creationTime);
  newInfo.author = info.author;
  //newInfo.comment = info.comment;
  newInfo.solvent = info.solvent;
  newInfo.temperature = info.temperature.magnitude;
  newInfo.probeName = info.probeName || '';
  newInfo.fieldStrength = info.fieldStrength.magnitude;

  let gyromagneticRatioConstants = newInfo.nucleus.map(
    (nucleus: string) => gyromagneticRatio[nucleus as Nuclei],
  );
  newInfo.baseFrequency = gyromagneticRatioConstants.map(
    (gmr: number) => (info.fieldStrength.magnitude * gmr) / (2 * Math.PI * 1e6),
  );
  newInfo.pulseSequence = info.experiment;

  newInfo.temperature =
    info.temperature.unit.toLowerCase() === 'celsius'
      ? 273.15 + info.temperature.magnitude
      : info.temperature.magnitude;

  newInfo.digitalFilter = info.digitalFilter;
  newInfo.pulseStrength90 = 1 / (4 * info.pulseStrength90.magnitude);
  newInfo.numberOfScans = info.numberOfScans;
  newInfo.relaxationTime = info.relaxationTime.magnitude;

  newInfo.isComplex = info.dataSections.includes('im');
  newInfo.isFid = info.dataUnits[0] === 'Second';
  newInfo.isFt = info.dataUnits[0] === 'Ppm';

  newInfo.dimension = info.dimension;

  const dimension = newInfo.dimension;

  newInfo.originFrequency = info.originFrequency
    .map((d) => d.magnitude / 1e6)
    .slice(0, dimension);
  newInfo.numberOfPoints = info.dataPoints.slice(0, 1);
  newInfo.frequencyOffset = info.frequencyOffset
    .map((f, i) => f.magnitude * newInfo.baseFrequency[i])
    .slice(0, dimension);
  newInfo.acquisitionTime = info.acquisitionTime
    .map((a) => a.magnitude)
    .slice(0, dimension);
  newInfo.spectralWidth = info.spectralWidth
    .map((sw, i) => (sw.magnitude / info.originFrequency[i].magnitude) * 1e6)
    .slice(0, dimension);

  newInfo.spectralWidthClipped = info.spectralWidthClipped
    .map((sw, i) => (sw.magnitude / newInfo.baseFrequency[i]) * 1e6)
    .slice(0, dimension);

  let dimensions = [];
  let options: any = {};
  let increment;
  for (let d = 0; d < info.dimension; d++) {
    increment = {
      magnitude: info.acquisitionTime[d].magnitude / (info.dataPoints[d] - 1),
      unit: 's',
    };
    if (info.dataUnits[d] === 'Second') {
      options.quantityName = 'time';
      options.originOffset = { magnitude: 0, unit: 's' };

      if (d === 0) {
        options.coordinatesOffset = {
          magnitude: info.digitalFilter * increment.magnitude,
          unit: 's',
        };
      } else {
        options.coordinatesOffset = { magnitude: 0, unit: 's' };
      }
      options.reciprocal = {
        originOffset: {
          magnitude: info.originFrequency[d].magnitude,
          unit: 'Hz',
        },
        quantityName: 'frequency',
        coordinatesOffset: {
          magnitude:
            (info.frequencyOffset[d].magnitude *
              info.originFrequency[d].magnitude) /
            1000000,
          unit: 'Hz',
        },
      };
    } else if (info.dataUnits[d] === 'Ppm') {
      options.quantityName = 'frequency';

      let origin = info.originFrequency[d].magnitude;
      options.originOffset = { magnitude: origin, unit: 'Hz' };

      let firstPoint = info.dataOffsetStart[0];
      let lastPoint = info.dataOffsetStop[0];
      let dataLength = lastPoint - firstPoint + 1;

      let spectralWidth = info.spectralWidthClipped[d].magnitude;
      let incr = spectralWidth / info.dataPoints[d];
      increment = { magnitude: incr, unit: 'Hz' };

      let offset = (info.dataAxisStop[0] * origin) / 1000000;
      options.coordinatesOffset = {
        magnitude: offset,
        unit: 'Hz',
      };

      // after increment is computed with whole frequency
      // and original number of points, we recast the
      // number of point for export
      if (dataLength < info.dataPoints[d]) {
        info.dataPoints[d] = dataLength;
      }
    }

    if (d === 0) {
      options.description = 'direct dimension';
    } else {
      options.description = 'indirect dimension';
    }
    dimensions.push({
      label: String(headers.dataAxisTitles[d]),
      count: Number(info.dataPoints[d]),
      increment,
      type: 'linear',
      description: String(options.description) || '',
      application: options.application || {},
      coordinatesOffset: options.coordinatesOffset || 0,
      originOffset: options.originOffset || 0,
      quantityName: String(options.quantityName) || '',
      reciprocal: options.reciprocal || {},
      period: options.period || 0,
      complexFFT: options.complexFFT || false,
    });
  }
  let dependentVariables = [];
  dependentVariables.push(
    formatDependentVariable(data, 11, {
      unit: 'none',
      quantityName: 'relative intensity',
      from: info.dataOffsetStart,
      to: info.dataOffsetStop,
    }),
  );

  let description = { ...newInfo };

  delete description.paramList;
  description.metadata = {
    ...merge({}, headers),
    ...merge({}, parameters),
    ...merge({}, paramArray),
  };

  let dataStructure = {
    timeStamp: Date.now(),
    description,
    dimensions,
    dependentVariables,
  };
  return [dataStructure];
}
