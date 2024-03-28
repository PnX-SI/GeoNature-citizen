import * as L from 'leaflet';
import { MainConfig } from '../../../../conf/main.config';

declare let $: any;

export const markerIcon = L.icon({
    iconUrl: MainConfig['OBS_POINTER'],
    iconAnchor: [16, 42],
});

export abstract class BaseDetailComponent {
    readonly URL = MainConfig.API_ENDPOINT;
    program_id: any;
    attributes = [];
    photos = [];
    clickedPhoto: any;
    module: string;
    obs_id: any;
    obs: any;
    site_id: any;
    site: any;
    username = null;

    showPhoto(photo) {
        // console.log('opening photo:');
        // console.log(photo);
        this.clickedPhoto = photo;
        $('#photoModal').modal('show');
    }
}
