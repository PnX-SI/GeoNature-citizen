export interface MediaItem {
    id_media: number;
    filename: string;
    id_observation?: number;
    cd_nom?: number;
    name: string | null;
    obs_txt: string | null;
    id_role: number | null;
    title: string;
    id_program: number;
}

export interface MediaList {
    [index: number]: MediaItem;
}
