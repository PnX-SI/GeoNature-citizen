import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { SiteModalFlowService } from '../modalflow/modalflow.service';
import { AppConfig } from '../../../../conf/app.config';
import { HttpClient } from '@angular/common/http';
import {
    BaseDetailComponent,
    markerIcon,
} from '../../base/detail/detail.component';

declare let $: any;

@Component({
    selector: 'app-site-detail',
    templateUrl: '../../base/detail/detail.component.html',
    styleUrls: [
        './../../observations/obs.component.css', // for form modal only
        '../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SiteDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit {
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        public flowService: SiteModalFlowService
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.site_id = params['site_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'sites';
    }

    ngAfterViewInit() {
        this.programService.getSiteDetails(this.site_id).subscribe((sites) => {
            this.site = sites['features'][0];
            this.photos = this.site.properties.photos;
            for (var i = 0; i < this.photos.length; i++) {
                this.photos[i]['url'] =
                    AppConfig.API_ENDPOINT + this.photos[i]['url'];
            }

            // setup map
            const map = L.map('map');
            L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap',
            }).addTo(map);

            let coord: number[];
            let latLng: L.LatLng;
            const geometryType = this.site.properties.program.geometry_type;

            switch (geometryType) {
                case 'POINT':
                default:
                    coord = this.site.geometry.coordinates;
                    latLng = L.latLng(coord[1], coord[0]);
                    L.marker(latLng, { icon: markerIcon }).addTo(map);
                    break;

                case 'LINESTRING':
                    coord = this.site.geometry.coordinates[0];
                    latLng = L.latLng(coord[1], coord[0]);
                    const lineLatLng = this.site.geometry.coordinates.map(
                        (c: number[]) => [c[1], c[0]]
                    );
                    L.polyline(lineLatLng, {
                        color: '#11aa9e',
                    }).addTo(map);
                    break;

                case 'POLYGON':
                    coord = this.site.geometry.coordinates[0][0];
                    latLng = L.latLng(coord[1], coord[0]);
                    const polygonLatLng = [this.site.geometry.coordinates[0].map(
                        (c: number[]) => [c[1], c[0]]
                    )] as L.LatLng[][];
                    L.polygon(polygonLatLng, {
                        color: '#11aa9e',
                    }).addTo(map);
                    break;
            }
            map.setView(latLng, 13);

            // prepare data
            if (this.site.properties.last_visit) {
                let data = this.site.properties.last_visit.json_data;
                var that = this;
                this.loadJsonSchema().subscribe((jsonschema: any) => {
                    let schema = jsonschema.schema.properties;
                    for (const k in data) {
                        let v = data[k];
                        that.attributes.push({
                            name: schema[k].title,
                            value: v.toString(),
                        });
                    }
                });
            }
        });
    }

    loadJsonSchema() {
        return this.http.get(`${this.URL}/sites/${this.site_id}/jsonschema`);
    }

    addSiteVisit() {
        this.flowService.addSiteVisit(this.site_id);
    }
}
