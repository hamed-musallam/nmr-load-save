import { join, resolve } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';

import { Spectrum1D } from '../../types/Spectra/Spectrum1D';
import { readZipFile } from '../readZip';

describe('readZip', () => {
  it('zip with two spectra and molfile', async () => {
    let path = join(__dirname, 'nmriumDataTest/');
    path = resolve(path);
    const fileCollection = await fileCollectionFromPath(path, {
      unzip: { zipExtensions: [] },
      ungzip: { gzipExtensions: [] },
    });
    const zipFile = fileCollection.files.filter(
      (file) => file.name === 'dataTest.zip',
    );
    let result = await readZipFile(zipFile[0], { '1d': [], '2d': [] });
    expect(result.spectra).toHaveLength(2);
    expect(result.molecules).toHaveLength(1);
    let spectrum0 = result.spectra[0] as Spectrum1D;
    expect(spectrum0.data.x).toHaveLength(16384);
    expect(spectrum0.data.re).toHaveLength(16384);
    expect(spectrum0.info.isFid).toBe(true);
    expect(spectrum0.info.solvent).toBe('CDCl3');
    let spectrum1 = result.spectra[1] as Spectrum1D;
    expect(spectrum1.data.x).toHaveLength(8192);
    expect(spectrum1.info.solvent).toBe('Acetone');
  });
});
