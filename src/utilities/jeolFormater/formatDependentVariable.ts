import { DoubleArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

import { Data1D } from '../../types/Data1D';

import { numericTypeTable, quantityTypeTable } from './constantTables';
/**
 * a class for dependent variable
 * @param {object || array} data - the dependent variable
 * @param {numericType} numericType - a number that correspond to a type of numeric used to store the components
 * @param {object} [options] - an object with options (name, unit, quantityName, componentLabels, sparseSampling, application, description)
 * @param {string} [options.name] - a name of the dependent variable
 * @param {string} [options.unit] - the unit of the dependent variable
 * @param {string} [options.quantityName] - a name of the quantity
 * @param {array} [options.componentLabels] - an array of labels for each component of the dependent variable
 * @return {object} - an dependent variable
 */

export interface FormatDependentVariableOptions {
  description?: string;
  application?: string;
  quantityType?: number;
  encoding?: string;
  name?: string;
  unit?: string;
  quantityName?: string;
  componentLabels?: any[];
  sparseSampling?: Record<string, any>;
  from?: number[];
  to?: number[];
}
export function formatDependentVariable(
  data: ReImInputData,
  numericType: number,
  options: FormatDependentVariableOptions = {},
) {
  let {
    quantityType = 0,
    encoding = 'none',
    name = '',
    unit = '',
    quantityName = '',
    componentLabels = [],
    sparseSampling = {},
    from = [0],
    to = [-1],
  } = options;

  if (isAnyArray(data)) {
    throw new Error('jeol with an array of data is not yet supported');
  } else if (!('re' in data && 'im' in data)) {
    throw new Error('Only re/im data is supported');
  }

  const components = fromReIm(data, from, to);
  if (componentLabels.length === 0) {
    componentLabels = components.componentLabels;
  }

  return {
    type: 'internal',
    quantityType: quantityTypeTable[quantityType],
    numericType: numericTypeTable[numericType],
    encoding,
    name,
    unit,
    quantityName,
    componentLabels,
    sparseSampling,
    description: options.description || '',
    application: options.application || '',
    components: components.components,
    dataLength: components.dataLength,
  };
}

/**
 * import object {re:[], im:[]} to component
 * @param {object} reIm - a reIm object to import
 * @param {number} from - lower limit
 * @param {number} to - upper limit
 * @return {array} - components
 */

type ReIm1D = Omit<Data1D, 'x'>;
interface MatrixReIm {
  re: DoubleArray[];
  im: DoubleArray[];
}
interface DeepReIm {
  re: ReIm1D | MatrixReIm;
  im: ReIm1D | MatrixReIm;
}

type ReImInputData = ReIm1D | MatrixReIm | DeepReIm;

function isNotDeepReIm(reIm: ReImInputData): reIm is ReIm1D | MatrixReIm {
  return isAnyArray(reIm.re) && isAnyArray(reIm.im);
}

function isReIm1D(reIm: ReIm1D | MatrixReIm): reIm is ReIm1D {
  return !isAnyArray(reIm.re[0]);
}
function fromReIm(reIm: ReImInputData, from: number[], to: number[]) {
  let dataLength: number[] = [];
  let componentLabels: string[] = [];
  let components: DoubleArray[] = [];
  if (isNotDeepReIm(reIm)) {
    if (isReIm1D(reIm)) {
      // if 1D
      dataLength[0] = setLengthComplex(from[0], to[0], reIm.re.length);
      let component = new Float64Array(dataLength[0]);
      for (let i = 0; i < dataLength[0]; i += 2) {
        let idx = i + from[0] * 2;
        component[i] = reIm.re[idx / 2];
        component[i + 1] = reIm.im[idx / 2];
      }
      components.push(component);
      componentLabels.push('complex');
    } else if (isAnyArray(reIm.re[0])) {
      // if 2D
      dataLength[0] = setLength(from[1], to[1], reIm.re.length);
      dataLength[1] = setLengthComplex(from[0], to[0], reIm.re[0].length);

      for (let j = 0; j < dataLength[0]; j++) {
        let component = new Float64Array(dataLength[1]);
        for (let i = 0; i < dataLength[1]; i += 2) {
          let idx = i + from[0] * 2;
          component[i] = reIm.re[j][idx / 2];
          component[i + 1] = reIm.im[j][idx / 2];
        }
        components.push(component);
      }
    } else {
      throw new Error('check your object');
    }
  } else if (isAnyArray(reIm.re.re)) {
    dataLength[0] = setLengthComplex(from[1], to[1], reIm.re.re.length);
    let re = fromReIm(reIm.re, from, to).components;
    let im = fromReIm(reIm.im, from, to).components;
    for (let j = 0; j < dataLength[0] / 2; j++) {
      components.push(re[j], im[j]);
    }
  } else {
    throw new Error('check the dimension or the type of data in your array');
  }
  return {
    dataLength,
    componentLabels,
    components,
  };
}

function setLength(from: number, to: number, length: number) {
  if (to - from + 1 < length) {
    return to - from + 1;
  } else {
    return length;
  }
}

function setLengthComplex(from: number, to: number, length: number) {
  if (to - from + 1 < length) {
    return (to - from + 1) * 2;
  } else {
    return length * 2;
  }
}
