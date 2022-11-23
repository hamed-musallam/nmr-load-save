// import { fileListFromPath } from 'filelist-utils';

// import { read } from '../../reader/read';
// import { writeNmredata } from '../writeNmredata';

describe('writeNmredata', () => {
  it.todo('i need to write this test');
  // it('read nmrium and write nmredata', async () => {
  // const path = './src/writer/__tests__/2-molecules-2-spectra.json';
  // const files = await fileListFromPath(path);
  // const data = await read(files);
  // const nmredata = await writeNmredata(data);
  // const keys = Object.keys(nmredata.files);
  // expect(keys).toHaveLength(2);
  // const sdf = await nmredata.file(keys[0])?.async('text');
  // const sdf1 = await nmredata.file(keys[1])?.async('text');
  // expect(sdf).toContain('cytisine');
  // expect(sdf).toContain('NMREDATA_2D_13C');
  // expect(sdf1).not.toContain('cytisine');
  // expect(sdf1).toContain('NMREDATA_1D_1H');
  // //I did manually remove the source
  // expect(keys.some((e) => /jcamp/.exec(e))).toBe(false);
  // });
});
