import * as L from 'leaflet';
import { AppConfig } from '../../../../conf/app.config';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

declare let $: any;

export const markerIcon = L.icon({
    iconUrl: 'assets/pointer-blue2.png',
    iconAnchor: [16, 42],
});

export abstract class BaseDetailComponent {
    readonly URL = AppConfig.API_ENDPOINT;
    program_id: any;
    attributes = [];
    photos = [];
    clickedPhoto: any;
    module: string;
    obs_id: any;
    obs: any;
    site_id: any;
    site: any;
    area_id: any;
    area: any;
    species_site_id: any;
    speciesSite: any;
    admin = false;
    userService: UserService;

    showPhoto(photo) {
        console.log('opening photo:');
        console.log(photo);
        this.clickedPhoto = photo;
        $('#photoModal').modal('show');
    }
}
