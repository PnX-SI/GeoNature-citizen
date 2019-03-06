export class Observation {
  id_observation: number;
  cd_nom: number;
  common_name: string;
  sci_name: string;
  count: number;
  date: Date;
  comment: string;
  obs_txt: string;

  /*
  constructor(
    public species: number,
    public date: string,
    public comment: string,
    public count: number
  ) { }
  */
}

export interface TaxonomyList {
  [index: number]: {
    medias: any;
    nom: Object;
    taxref: Object;
  };
}
