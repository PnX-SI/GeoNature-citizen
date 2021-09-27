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
    implements AfterViewInit
{
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
            this.photos.forEach((e, i) => {
                this.photos[i]['url'] =
                    AppConfig.API_ENDPOINT + this.photos[i]['url'];
            });
            // for (var i = 0; i < this.photos.length; i++) {
            //     this.photos[i]['url'] =
            //         AppConfig.API_ENDPOINT + this.photos[i]['url'];
            // }

            // setup map
            const map = L.map('map');
            L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap',
            }).addTo(map);

            const coord = this.site.geometry.coordinates;
            const latLng = L.latLng(coord[1], coord[0]);
            map.setView(latLng, 13);

            L.marker(latLng, { icon: markerIcon }).addTo(map);

            // prepare data
            if (this.site.properties.visits) {
                this.site.properties.visits.forEach((e) => {
                    const data = e.json_data;
                    const visitData = { date: e.date, author: e.author };
                    this.loadJsonSchema().subscribe((jsonschema: any) => {
                        const schema = jsonschema.schema.properties;
                        const custom_data = [];
                        for (const k in data) {
                            const v = data[k];
                            custom_data.push({
                                name: schema[k].title,
                                value: v.toString(),
                            });
                        }
                        if (custom_data.length > 0) {
                            visitData['data'] = custom_data;
                        }
                    });
                    this.attributes.push(visitData);
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
