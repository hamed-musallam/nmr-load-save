import { Info, Metadata } from './getInfoFromMeta';

export function getNucleusFromMetadata(
  metaData: Metadata,
  info: Info,
  subfix: string,
) {
  let nucleus: string[] = [];
  if (metaData[`${subfix}AXNUC`]) {
    nucleus = metaData[`${subfix}AXNUC`];
    if (!Array.isArray(nucleus)) nucleus = [nucleus];
    nucleus = checkForNucleus(nucleus);
  }

  if (nucleus.length < 1 && metaData[`${subfix}NUC1`]) {
    nucleus = metaData[`${subfix}NUC1`];
    if (!Array.isArray(nucleus)) nucleus = [nucleus];
    nucleus = checkForNucleus(nucleus);
  }

  if (nucleus.length === 0) {
    if (metaData['.NUCLEUS']) {
      nucleus = metaData['.NUCLEUS']
        .split(',')
        .map((nuc: string) => nuc.trim());
    } else if (metaData['.OBSERVENUCLEUS']) {
      nucleus = [metaData['.OBSERVENUCLEUS'].replace(/[^A-Za-z0-9]/g, '')];
    } else {
      nucleus = getNucleusFrom2DExperiment(info.experiment);
    }
    nucleus = checkForNucleus(nucleus);
  }

  if (metaData['2D_X_NUCLEUS'] && metaData['2D_Y_NUCLEUS']) {
    nucleus = [
      metaData['2D_X_NUCLEUS'].replace(/[^A-Za-z0-9]/g, ''),
      metaData['2D_Y_NUCLEUS'].replace(/[^A-Za-z0-9]/g, ''),
    ];
  }
  return nucleus;
}

/**
 * Returns a list of likely nuclei based on an experiment string
 * This is really an hypothesis and should not be used
 * @param {string} experiment
 * @return {string[]}
 */

function getNucleusFrom2DExperiment(experiment: string) {
  if (typeof experiment !== 'string') {
    return [];
  }
  experiment = experiment.toLowerCase();
  if (experiment.includes('jres')) {
    return ['1H', 'Hz'];
  }
  if (experiment.includes('hmbc') || experiment.includes('hsqc')) {
    return ['1H', '13C'];
  }
  if (experiment.includes('cosy') || experiment.includes('tocsy')) {
    return ['1H', '1H'];
  }
  return [];
}

function checkForNucleus(nucleus: string[]) {
  nucleus = nucleus.map((value) =>
    value
      .replace(/[^A-Za-z0-9]/g, '')
      .replace('NA', '')
      .replace('off', ''),
  );
  let beforeLength = nucleus.length;
  nucleus = nucleus.filter((value) => value);
  return nucleus.length !== beforeLength ? [] : nucleus;
}
