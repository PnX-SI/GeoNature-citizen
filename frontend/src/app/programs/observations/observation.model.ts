import { Feature, FeatureCollection } from "geojson";

export interface PostObservationResponse extends FeatureCollection {
  message: string;
  features: ObservationFeature[];
}

export interface ObservationFeature extends Feature {
  properties: {
    cd_nom: number;
    comment: string;
    common_name: string;
    count: number;
    date: Date;
    id_observation: number;
    images?: string[];
    municipality?: any;
    obs_txt: string;
    observer?: any;
    sci_name: string;
    timestamp_create: Date;
  };
}

export interface TaxonomyListItem {
  medias: any;
  nom: Object;
  taxref: Object;
}

export interface TaxonomyList {
  [index: number]: TaxonomyListItem;
}
