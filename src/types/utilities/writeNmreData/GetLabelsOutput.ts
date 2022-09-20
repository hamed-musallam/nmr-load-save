import { ByAssignNumber } from './ByAssignNumber';
import { ByDiaID } from './ByDiaID';

export interface GetLabelsOutput {
  byDiaID: ByDiaID;
  byAssignNumber: ByAssignNumber;
}
