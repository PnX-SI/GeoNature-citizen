import { Feature, FeatureCollection } from 'geojson';

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

export interface Stats {
    count_taxa: number;
    count_obs: number;
    count_sites: number;
    count_programs: number;
    count_users: number;
}

export interface Coordinates {
    type: string;
    coordinates: [number, number];
}

export interface Media {
    id_media: number;
    nom_type_media: string;
}

export interface Photo {
    author: string;
    date: string;
    url: string;
}

export interface Taxref {
    cd_nom: number;
    cd_ref: number;
    lb_nom: string;
    nom_vern: string;
}

export interface Observer {
    username: string;
    userAvatar?: string;
    id_role: number;
    avatar?: string;
}

export interface ObservationProperties {
    cd_nom: number;
    comment: string;
    count: number;
    date: string;
    id_observation: number;
    id_program: number;
    json_data: any;
    medias: Media[];
    municipality: string;
    obs_txt: string;
    observer: Observer | string | null;
    photos: Photo[];
    taxref: Taxref;
    timestamp_create: string;
    validation_status?: string;
}

export interface ObservationFeature extends Feature {
    properties: ObservationProperties;
}
export interface ObservationFeatureCollection extends FeatureCollection {
    page?: number;
    pages?: number;
    per_page?: number;
    total?: number;
    features: ObservationFeature[];
}

export interface PostObservationResponse extends ObservationFeatureCollection {
    message: string;
}
