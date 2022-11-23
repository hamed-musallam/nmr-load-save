/*  NMRium version: 0.33.0

    Notes: Any 2d file containing fid spectra should be regenerated with nmr-load-save package because the parser did not handle it correctly before this version

    * changes from version 3 to version 4:
       change the 2d data structure, in version 3 the 2D FT spectra have this structure which represents the real part that should be migrated to the new structure for 2D
        FT which contains `rr`, `ii`, `ri` and `ir` where `r` stands for the real part and `i` stands for the imaginary part
            Data
                {
                    data: {
                            z:Array<Array<Float64Array>>,
                            minX:number,
                            maxX:number,
                            minY:number,
                            maxY:number,
                            minZ:number,
                            maxZ:number,
                            noise:number
                        }
                }

                =>

               {
                    data: {
                            rr: {
                                    z:Array<Array<Float64Array>>,
                                    minX:number,
                                    maxX:number,
                                    minY:number,
                                    maxY:number,
                                    minZ:number,
                                    maxZ:number,
                                    noise:number
                                }
                            }
                }


            paths:
              - spectra > data
    */

export default function migrateToVersion4(data: any): any {
  if (data?.version === 4) return data;

  const newData = { ...data, version: 4 };

  for (const spectrum of newData.spectra) {
    const { dimension, isFt } = spectrum.info;
    if (dimension === 2 && isFt) {
      spectrum.data = { rr: spectrum.data };
    }
  }

  return newData;
}
