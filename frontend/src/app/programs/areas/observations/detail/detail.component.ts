import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { MainConfig } from '../../../../../conf/main.config';
import { HttpClient } from '@angular/common/http';
import {
    BaseDetailComponent,
    markerIcon,
} from '../../../base/detail/detail.component';
import { Location } from '@angular/common';

declare let $: any;

@Component({
    selector: 'app-species-site-obs-detail',
    templateUrl: '../../../base/detail/detail.component.html',
    styleUrls: [
        './../../../observations/obs.component.css', // for observation_form modal only
        '../../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSiteObsDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit
{
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        public location: Location,
        private programService: GncProgramsService
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.obs_id = params['obs_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'areas-observations';
    }

    ngAfterViewInit() {
        this.programService
            .getSpeciesSiteObsDetails(this.obs_id)
            .subscribe((obs) => {
                this.obs = obs['features'][0];
                this.photos = [];
                this.photos = this.obs.properties.photos;
                for (let i = 0; i < this.photos.length; i++) {
                    this.photos[i]['url'] =
                        MainConfig.API_ENDPOINT + this.photos[i]['url'];
                }

                // setup map
                const map = L.map('map');
                L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap',
                }).addTo(map);

                const coord = this.obs.geometry.coordinates;
                const latLng = L.latLng(coord[1], coord[0]);
                map.setView(latLng, 13);

                L.marker(latLng, { icon: markerIcon }).addTo(map);

                // prepare data
                if (this.obs.properties.json_data) {
                    const data = this.obs.properties.json_data;
                    const that = this;
                    this.loadJsonSchema().subscribe((customform: any) => {
                        const schema = customform.json_schema.schema.properties;
                        const layout = customform.json_schema.layout;
                        for (const item of layout) {
                            const v = data[item.key];
                            if (v !== undefined) {
                                that.attributes.push({
                                    name: schema[item.key].title,
                                    value: v.toString(),
                                });
                            }
                        }
                    });
                }
            });
    }

    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/programs/${this.program_id}/customform/`
        );
    }
}
