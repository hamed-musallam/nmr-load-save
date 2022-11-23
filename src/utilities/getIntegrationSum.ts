import { Molecule } from 'openchemlib';

export function getIntegrationSum(molecule: Molecule, info: any) {
  const molecularFormula = molecule.getMolecularFormula().formula;
  const elementaryAnalisys = [
    ...molecularFormula.matchAll(/(?<element>[A-Z][a-z]?)(?<count>\d*)/g),
  ].map((entry) => ({
    element: entry?.groups?.element,
    count: entry?.groups?.count ? Number(entry.groups.count) : 1,
  }));
  const currentElement = [
    ...info.nucleus[0].matchAll(/[0-9]*(?<element>[A-Z][a-z]?)/g, '$element'),
  ][0].groups.element;

  return (
    elementaryAnalisys.find((row) => row.element === currentElement)?.count ||
    100
  );
}
