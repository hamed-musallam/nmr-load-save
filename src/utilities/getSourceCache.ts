import { readJcampFromURL } from '../reader/readJcamp';
import { NmriumLikeObject } from '../types/NmriumLikeObject';
import { ParsingOptions } from '../types/Options/ParsingOptions';

export async function getSourceCache(data: any, options: ParsingOptions = {}) {
  const { jcampParsingOptions } = options;
  const uniqueSourceURL = getUniqueSourceURL(data);
  const promises = uniqueSourceURL.map((sourceURL) =>
    readJcampFromURL(sourceURL, jcampParsingOptions),
  );
  const parsedSources = await Promise.all(promises);
  const sourceCache: Record<string, NmriumLikeObject> = {};
  for (let i = 0; i < uniqueSourceURL.length; i++) {
    sourceCache[uniqueSourceURL[i]] = parsedSources[i];
  }

  return sourceCache;
}

function getUniqueSourceURL(data: any): string[] {
  const uniqueSourceURL = new Set<string>();
  for (let datum of data.spectra) {
    if (datum.source.jcampURL != null) {
      uniqueSourceURL.add(datum.source.jcampURL);
    }
  }
  return Array.from(uniqueSourceURL);
}
