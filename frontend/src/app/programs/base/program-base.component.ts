import { AfterViewInit } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { Program } from '../programs.models';
import * as L from 'leaflet';
import { MainConfig } from '../../../conf/main.config';

export abstract class ProgramBaseComponent implements AfterViewInit {
    MainConfig = MainConfig;
    fragment: string;
    coords: L.Point;
    program_id: number;
    programs: Program[];
    program: Program;
    taxonomyListID: number;
    programFeature: FeatureCollection;
    abstract flowService: any;

    ngAfterViewInit(): void {
        try {
            if (this.fragment) {
                document
                    .querySelector('#' + this.fragment)
                    .scrollIntoView({ behavior: 'smooth' });
            }
        } catch (e) {
            //alert(e);
        }
    }

    ngOnDestroy(): void {
        this.flowService.closeModal();
    }

    onMapClicked(p: L.Point): void {
        this.coords = p;
    }
}
