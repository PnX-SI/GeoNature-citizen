import { Feature, FeatureCollection } from 'geojson';


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
        validation_status?: string;
        taxref: any;
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

export interface ObservationFeatureCollection extends FeatureCollection {
    page?: number;
    pages?: number;
    per_page?: number;
    total?: number;
    features: Array<ObservationFeature>;
}
