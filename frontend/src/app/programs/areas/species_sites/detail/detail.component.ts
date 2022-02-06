import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { AreaModalFlowService } from '../../modalflow/modalflow.service';
import { AppConfig } from '../../../../../conf/app.config';
import { HttpClient } from '@angular/common/http';
import { BaseDetailComponent } from '../../../base/detail/detail.component';
import { Location } from '@angular/common';
import { AreaService } from '../../areas.service';
import { MAP_CONFIG } from '../../../../../conf/map.config';

declare let $: any;

export const speciesSiteFormMarkerIcon = L.icon({
    iconUrl: MAP_CONFIG.SPECIES_SITE_POINTER,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
});

@Component({
    selector: 'app-species-site-detail',
    templateUrl: '../../../base/detail/detail.component.html',
    styleUrls: [
        '../../../observations/obs.component.css', // for observation_form modal only
        '../../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSiteDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit
{
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        private areaService: AreaService,
        public location: Location,
        public flowService: AreaModalFlowService
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.species_site_id = params['species_site_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'species_sites';

        this.areaService.newSpeciesSiteObsCreated.subscribe(() => {
            this.programService
                .getSpeciesSiteDetails(this.species_site_id)
                .subscribe((speciesSites) => {
                    this.speciesSite = speciesSites['features'][0];
                });
        });
    }

    ngAfterViewInit() {
        this.programService
            .getSpeciesSiteDetails(this.species_site_id)
            .subscribe((speciesSites) => {
                this.speciesSite = speciesSites['features'][0];
                this.photos = this.speciesSite.properties.photos;
                if (Array.isArray(this.photos)) {
                    for (let i = 0; i < this.photos.length; i++) {
                        this.photos[i]['url'] =
                            AppConfig.API_ENDPOINT + this.photos[i]['url'];
                    }
                }

                // setup map
                const map = L.map('map');
                L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap',
                }).addTo(map);

                const coord = this.speciesSite.geometry.coordinates;
                const latLng = L.latLng(coord[1], coord[0]);
                map.setView(latLng, 13);

                L.marker(latLng, { icon: speciesSiteFormMarkerIcon }).addTo(
                    map
                );

                // prepare data
                if (this.speciesSite.properties) {
                    const data = this.speciesSite.properties.json_data;
                    this.loadJsonSchema().subscribe(
                        function (json_schema: any) {
                            const schema = json_schema.schema.properties;
                            const layout = json_schema.layout;
                            for (const item of layout) {
                                const v = data[item.key];
                                if (v !== undefined) {
                                    this.attributes.push({
                                        name: schema[item.key].title,
                                        value: v.toString(),
                                    });
                                }
                            }
                        }.bind(this)
                    );
                }
            });
    }

    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/areas/program/${this.program_id}/species_site/jsonschema`
        );
    }

    addSpeciesSiteObservation() {
        this.flowService.addSpeciesSiteObservation(this.species_site_id);
    }
}
