import { DoubleArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

export type Convertible<T = DoubleArray> = T | T[] | Record<string, T | T[]>;

export function convertToFloatArray(data: Convertible) {
  if (isAnArray(data)) {
    return convertAnArray(data);
  } else {
    const newData: Record<string, Float64Array | Float64Array[]> = {};
    for (let key in data) {
      const currentData = data[key];
      newData[key] = convertAnArray(currentData);
    }
    return newData;
  }
}

function isAnArray(
  data: Convertible<DoubleArray>,
): data is DoubleArray | DoubleArray[] {
  return isAnyArray(data);
}

function convertAnArray<T extends DoubleArray | DoubleArray[]>(data: T) {
  if (isBidimensionalArray(data)) {
    return data.map(convertAnArrayToFloat);
  }
  return convertAnArrayToFloat(data);
}

function convertAnArrayToFloat(data: DoubleArray): Float64Array {
  return Float64Array.from(data);
}

function isBidimensionalArray(
  data: DoubleArray | DoubleArray[],
): data is DoubleArray[] {
  return isAnyArray(data[0]);
}
