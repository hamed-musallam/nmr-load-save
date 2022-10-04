import { join } from 'path';

import {
  getData as getBrukerData,
  getFile as getBrukerFile,
} from 'bruker-data-test';
import {
  FileCollection,
  fileCollectionFromZip,
  fileCollectionFromPath,
} from 'filelist-utils';
import { getFile as getJcampFile } from 'jcamp-data-test';
import { getFile as getJeolFile } from 'jeol-data-test';
import { getFile as getNMReDataFileList } from 'nmredata-data-test';

import { Spectrum1D } from '../../types/Spectra/Spectrum1D';
import { Spectrum2D } from '../../types/Spectra/Spectrum2D';
import { read } from '../read';

describe('read by extension', () => {
  it('jcamp', async () => {
    let jcampData = await getJcampFile('aspirin-1h.dx');
    let result = await read(jcampData);
    const spectrum = result.spectra[0] as Spectrum1D;
    expect(result.spectra).toHaveLength(1);
    expect(spectrum.info.isFid).toBe(false);
    expect(spectrum.data.x).toHaveLength(32 * 1024);
    expect(spectrum.info.solvent).toBe('CDCl3');
  });
  it('Bruker fileCollection of a zip', async () => {
    const brukerFile = await getBrukerFile('aspirin-1h.zip');
    const result = await read(new FileCollection([brukerFile]));
    expect(result.spectra).toHaveLength(1);
    const spectrum = result.spectra[0] as Spectrum1D;
    expect(spectrum.info.isFid).toBe(true);
    expect(spectrum.data.x).toHaveLength(16384);
    expect(spectrum.info.solvent).toBe('CDCl3');
  });

  it('Bruker FileCollectionItem of a zip', async () => {
    const brukerFile = await getBrukerFile('aspirin-1h.zip');
    const result = await read(brukerFile);
    expect(result.spectra).toHaveLength(1);
    const spectrum = result.spectra[0] as Spectrum1D;
    expect(spectrum.info.isFid).toBe(true);
    expect(spectrum.data.x).toHaveLength(16384);
    expect(spectrum.info.solvent).toBe('CDCl3');
  });
  it('Bruker fileList of a folder', async () => {
    const zipBuffer = await getBrukerData('aspirin-1h.zip');
    const fileCollection = await fileCollectionFromZip(zipBuffer);
    const result = await read(fileCollection);
    expect(result.spectra).toHaveLength(1);
    const spectrum = result.spectra[0] as Spectrum1D;
    expect(spectrum.info.isFid).toBe(true);
    expect(spectrum.data.x).toHaveLength(16384);
    expect(spectrum.info.solvent).toBe('CDCl3');
  });

  it('nmredata file list', async () => {
    let file = await getNMReDataFileList('generated.zip');
    const newFile = { ...file, name: file.name.replace(/\.zip/, '.nmredata') };

    let result = await read(newFile);
    expect(result.molecules).toHaveLength(1);
    expect(result.spectra).toHaveLength(2);
    expect(result.molecules[0].molfile).toContain('CCc1ccccc1');
  });

  it('jeol', async () => {
    const data = await getJeolFile(
      'Rutin_3080ug200uL_DMSOd6_HSQC_400MHz_Jeol.jdf',
    );
    let result = await read(data);
    expect(result.spectra).toHaveLength(1);
    const spectrum = result.spectra[0] as Spectrum2D;
    expect(spectrum.info.nucleus[0]).toBe('1H');
    expect(spectrum.info.nucleus[1]).toBe('13C');
    expect(spectrum.data.z[0]).toHaveLength(4096);
  });

  it('nmrium fetch jcampURL', async () => {
    const path = join(__dirname, './nmriumDataTest');
    const files = await fileCollectionFromPath(path);
    const data = await read(files);
    expect(data.spectra).toHaveLength(3);
  });
});
