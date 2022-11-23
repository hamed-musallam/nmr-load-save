import { Source } from '../Source';

export interface JcampParsingOptions {
  name?: string;
  source?: Source;
  noContour?: boolean;
  keepRecordsRegExp?: RegExp;
  profiling?: boolean;
}
