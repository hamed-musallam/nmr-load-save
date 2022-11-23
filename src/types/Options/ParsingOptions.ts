import { BrukerParsingOptions } from './BrukerParsingOptions';
import { JcampParsingOptions } from './JcampParsingOptions';
import { NmredataParsingOptions } from './NmredataParsingOptions';

export interface ParsingOptions {
  name?: string;
  jcampParsingOptions?: JcampParsingOptions;
  brukerParsingOptions?: BrukerParsingOptions;
  nmredataParsingOptions?: NmredataParsingOptions;
}
