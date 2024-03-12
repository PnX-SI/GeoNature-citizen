import { Feature, FeatureCollection } from 'geojson';


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
interface GenericObject {
    [k: string]: boolean | number | string;
}

export interface Taxref {
    cd_nom: number;
    cd_ref: number;
    cd_sup: number | null;
    cd_taxsup: number | null;
    classe: string | null;
    famille: string | null;
    group1_inpn: string | null;
    group2_inpn: string | null;
    id_habitat: string | null;
    id_rang: string | null;
    id_statut: string | null;
    lb_auteur: string;
    lb_nom: string;
    nom_complet: string;
    nom_complet_html: string;
    nom_valide: string;
    nom_vern: string;
    nom_vern_eng: string | null;
    ordre: string | null;
    phylum: string | null;
    regne: string | null;
    sous_famille: string | null;
    tribu: string | null;
    url: string | null;
}

export interface TaxonomyListItem {
    medias: GenericObject[];
    cd_nom: number;
    nom_francais: string | null;
    taxref: Taxref;
}

export type TaxonomyList = Array<TaxonomyListItem>;

export interface ObservationFeatureCollection extends FeatureCollection {
    page?: number;
    pages?: number;
    per_page?: number;
    total?: number;
    features: Array<ObservationFeature>;
}

export interface PostObservationResponse extends ObservationFeatureCollection {
    message: string;
}
