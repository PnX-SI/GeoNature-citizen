import { SafeHtml } from '@angular/platform-browser';
import { TileLayerOptions } from 'leaflet';
import { Position, Point } from 'geojson';

export class Program {
    id_program: number;
    title: string;
    short_desc: string;
    long_desc: string;
    html_short_desc: SafeHtml;
    html_long_desc: SafeHtml;
    image: string;
    logo: string;
    id_module: number;
    module: any;
    taxonomy_list: number;
    registration_required: boolean;
    on_sidebar: boolean;
}

export interface BaseLayer extends TileLayerOptions {
    name: string;
    layer?: string;
    attribution: string;
    detectRetina?: boolean;
    apiKey?: string;
    layerName?: string;
}

export interface GeometryPoint {
    type: 'Point';
    coordinates: Position; // Tuple for [longitude, latitude]
}
