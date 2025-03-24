import { SafeHtml } from '@angular/platform-browser';
import { Feature, FeatureCollection } from 'geojson';

interface GenericObject {
    [k: string]: boolean | number | string | GenericObject;
}

interface TaxrefLimited {
    cd_nom: number;
    cd_ref: number;
    lb_nom: string;
    nom_vern: string;
}
export interface Photo {
    author: string;
    date: string; // Format ISO: YYYY-MM-DD
    url: string; // Chemin ou URL de la photo
}

export interface ObservationProperties {
    cd_nom: number;
    comment: string;
    common_name: string;
    count: number;
    date: Date;
    id_observation: number;
    id_program?: number;
    images?: string[];
    municipality?: string | null;
    obs_txt: string;
    observer?: any;
    sci_name: string;
    timestamp_create: Date;
    validation_status?: string;
    photos?: Photo[];
    medias?: Media[];
    taxref: TaxrefLimited;
    name?: string;
    json_data?: GenericObject;
}

export interface ObservationFeature extends Feature {
    properties: ObservationProperties;
}
export interface TaxonBase {
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

export interface Taxon extends TaxonBase {
    nom_complet_html_sanitized: SafeHtml;
}

export interface TaxonomyListItem {
    medias: Media[];
    attributs: AttributItem[];
    cd_nom: number;
    nom_francais: string | null;
    taxref: TaxonBase;
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

export type ObservationPropertiesList = ObservationProperties[];

export interface AttributItem {
    cd_ref: number;
    id_attribut: number;
    valeur_attribut: string;
}

export interface Attribut {
    id_attribut: number; // Identifiant unique de l'attribut
    nom_attribut: string; // Nom de l'attribut
    label_attribut: string; // Libellé de l'attribut
    desc_attribut: string; // Description de l'attribut
    type_attribut: string; // Type de l'attribut (par ex. "text")
    type_widget: string; // Type de widget associé à l'attribut (par ex. "textarea", "select")
    liste_valeur_attribut: string; // Liste des valeurs possibles pour l'attribut (en format JSON)
    regne: string | null; // Règne biologique associé (si applicable)
    group2_inpn: string | null; // Groupe INPN de niveau 2 (si applicable)
    obligatoire: boolean; // Indicateur si l'attribut est obligatoire
    ordre: number | null; // Ordre d'affichage de l'attribut (si défini)
    id_theme: number; // Identifiant du thème auquel appartient l'attribut
}

export interface MediaBase {
    id_media: number; // Identifiant unique du média
    media_url?: string; // URL du média
    titre?: string; // Titre du média
    auteur?: string | null; // Auteur du média (peut être null)
    cd_ref?: number; // Référence principale du média associée à l'espèce
    chemin?: string; // Chemin du fichier du média sur le serveur
    desc_media?: string; // Description du média (chaîne vide si non renseignée)
    id_type?: number; // Identifiant du type du média (ex. image, vidéo, photo, etc.)
    is_public?: boolean; // Indicateur de visibilité publique du média
    licence?: string | null; // Licence associée au média (peut être null)
    source?: string | null; // Source du média (peut être null)
    url?: string | null; // URL associée au média (peut être null)
}

export interface Media extends MediaBase {
    nom_type_media: string;
}
