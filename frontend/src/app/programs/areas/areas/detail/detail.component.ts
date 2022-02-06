import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { AreaModalFlowService } from '../../modalflow/modalflow.service';
import { HttpClient } from '@angular/common/http';
import { BaseDetailComponent } from '../../../base/detail/detail.component';
import { Location } from '@angular/common';
import { AreaService } from '../../areas.service';
import { UserService } from '../../../../auth/user-dashboard/user.service.service';
import { MAP_CONFIG } from '../../../../../conf/map.config';

declare let $: any;
const markerIcon = L.icon({
    iconUrl: MAP_CONFIG['SPECIES_SITE_POINTER'],
    iconSize: [48, 48],
    iconAnchor: [24, 48],
});

@Component({
    selector: 'app-area-detail',
    templateUrl: '../../../base/detail/detail.component.html',
    styleUrls: [
        '../../../observations/obs.component.css', // for observation_form modal only
        '../../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AreaDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit
{
    map;
    leafletArea;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        public userService: UserService,
        private areaService: AreaService,
        public location: Location,
        public flowService: AreaModalFlowService
    ) {
        super();
        this.userService = userService;
        this.route.params.subscribe((params) => {
            this.area_id = params['area_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'areas';
        this.areaService.newSpeciesSiteCreated.subscribe(
            this.getData.bind(this)
        );
        this.areaService.areaEdited.subscribe(this.getData.bind(this));
    }

    ngAfterViewInit() {
        this.map = L.map('map');
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
        }).addTo(this.map);

        this.getData();
    }

    getData() {
        this.programService.getAreaDetails(this.area_id).subscribe((areas) => {
            this.area = areas['features'][0];

            if (this.leafletArea) {
                this.map.removeLayer(this.leafletArea);
            }
            this.leafletArea = L.geoJSON(this.area);

            const speciesSites = this.area.properties.species_sites.features;
            speciesSites.forEach((speciesSite) => {
                const coords = speciesSite.geometry.coordinates.reverse();
                L.marker(coords, { icon: markerIcon }).addTo(this.leafletArea);
            });

            this.leafletArea.addTo(this.map);

            const maxBounds = this.leafletArea.getBounds();
            this.map.fitBounds(maxBounds);
            this.map.setMaxBounds(maxBounds);

            // prepare data
            if (this.area.properties) {
                const areaCenter = L.geoJSON(this.area).getBounds().getCenter();
                this.area.properties.coords = new L.Point(
                    areaCenter.lng,
                    areaCenter.lat
                );

                const data = this.area.properties.json_data;
                this.loadJsonSchema().subscribe(
                    function (json_schema: any) {
                        this.attributes = [];
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
        return this.http.get(`${this.URL}/areas/${this.area_id}/jsonschema`);
    }

    addAreaSpeciesSite() {
        this.flowService.addAreaSpeciesSite(this.area_id);
    }
}
