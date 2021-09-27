import * as L from 'leaflet';
import { Component, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { Program } from '../../programs/programs.models';
import { conf } from '../../programs/base/map/map.component';
import { MAP_CONFIG } from '../../../conf/map.config';
import { dashboardData, dashboardDataType } from '../../../conf/dashboard.config';

@Component({
    selector: 'dashboard-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
})

export class DashboardMapComponent implements OnInit {
    dashboardData: dashboardDataType;
    localeId: string;
    dashboardMap: L.Map;
    programMaxBounds: L.LatLngBounds;
    options: any;
    programs: Program[];
    constructor(
        private router: Router,
        private programService: GncProgramsService
    ) {}

    ngOnInit(): void {
        this.dashboardData = dashboardData;
        this.programService.getAllPrograms().subscribe((programs) => {
            this.programs = programs;
            this.initMap(conf);
            this.addLayers(programs);
        })

    }

    initMap(options: any, LeafletOptions: any = {}): void {
        console.log('options', options);

        this.options = options;

        this.dashboardMap = L.map('dashboardMap', {
            layers: [this.options.DEFAULT_BASE_MAP()],
           // gestureHandling: true,
            ...LeafletOptions,
        });
        this.dashboardMap.setView(
            [this.dashboardData.base.lat, this.dashboardData.base.lon],
            11
        );

        // const map = L.map('dashboardMap');
        // L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     attribution: 'OpenStreetMap',
        // }).addTo(map);
        // map.setView([50, 5], 13);


        // L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     attribution: 'OpenStreetMap',
        // }).addTo(this.dashboardMap);

        this.dashboardMap.zoomControl.setPosition(
            this.options.ZOOM_CONTROL_POSITION
        );

        L.control
            .scale({ position: this.options.SCALE_CONTROL_POSITION })
            .addTo(this.dashboardMap);

        L.control
            .layers(this.options.BASE_LAYERS, null, {
                collapsed: this.options.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                position: this.options.BASE_LAYER_CONTROL_POSITION,
            })
            .addTo(this.dashboardMap);

        // L.control
        //     .locate({
        //         icon: 'fa fa-compass',
        //         position: this.options.GEOLOCATION_CONTROL_POSITION,
        //         strings: {
        //             title: MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
        //                 ? MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
        //                 : 'Me géolocaliser',
        //         },
        //         getLocationBounds: (locationEvent) =>
        //             locationEvent.bounds.extend(this.programMaxBounds),
        //         locateOptions: {
        //             enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY,
        //         },
        //     } as any)
        //     .addTo(this.dashboardMap);

        console.log('dashboardmap', this.dashboardMap)

    }

    addLayers (programs: Program[]) {
        console.log('add layers');

        for (let p of programs) {
            this.programService.getProgram(p.id_program).subscribe((program) => {
                L.geoJSON(program, {
                    // style: (_feature) =>
                    //     this.options.PROGRAM_AREA_STYLE(_feature),
                }
                ).addTo(this.dashboardMap);
            })
        }

    }

}
