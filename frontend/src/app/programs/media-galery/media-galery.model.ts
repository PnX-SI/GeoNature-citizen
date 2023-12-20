export interface MediaItem {
    id_media: number;
    filename: string;
    id_data_source: number ;
    cd_nom: number | null;
    name: string | null;
    observer: string | null;
    id_observer: number | null;
    date: string;
    id_site: number | null;
    program: string;
    id_program: number;
    type_program: "observations" | "sites";
    media_url: string;
    data_url: string;
}

export interface MediaList extends Array<MediaItem>{}
