import { NMRRangeWithSignalAndIntegration } from '../addRanges';

export function joinRanges<T extends NMRRangeWithSignalAndIntegration>(
  ranges: T[],
) {
  ranges.sort((a, b) => a.from - b.from);
  for (let i = 0; i < ranges.length - 1; i++) {
    if (ranges[i].to > ranges[i + 1].from) {
      ranges[i].to = Math.max(ranges[i + 1].to, ranges[i].to);
      ranges[i].signals = ranges[i].signals.concat(ranges[i + 1].signals);
      ranges[i].integration += ranges[i + 1].integration;
      ranges.splice(i + 1, 1);
      i--;
    }
  }
  return ranges;
}
