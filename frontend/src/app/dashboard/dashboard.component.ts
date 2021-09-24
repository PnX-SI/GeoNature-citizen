import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from '../../conf/app.config';
import { Title } from '@angular/platform-browser';
import { GncProgramsService } from '../api/gnc-programs.service';
import { FeatureCollection, Geometry } from 'geojson';
import { Program } from '../programs/programs.models';
import { dashboardData, dashboardDataType } from '../../conf/dashboard.config';
import { SitesComponent } from '../programs/sites/sites.component';

interface ExtraFeatureCollection extends FeatureCollection {
    [key: string]: any
}

interface CountByKey {
    name: string;
    count: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
    dashboardData: dashboardDataType;
    programs: Program[];
    sitePoint: ExtraFeatureCollection;
    siteLine: ExtraFeatureCollection;
    sitePolygon: ExtraFeatureCollection;
    programPoint: FeatureCollection;
    programLine: FeatureCollection;
    programPolygon: FeatureCollection;
    sumLineLength: number;
    constructor(
        private router: Router,
        private titleService: Title,
        private programService: GncProgramsService
    ) { }

    ngOnInit(): void {

        this.dashboardData = dashboardData;

        this.titleService.setTitle(`${AppConfig.appName} - tableau de bord`);

        this.programService.getAllPrograms().subscribe((programs) => {
            this.programs = programs;
            console.log('this.programs: ', this.programs);

            for (let p of this.programs) {
                this.programService.getProgram(p.id_program).subscribe((program) => {
                    if (program.features[0].properties.short_desc.includes('arbres')) {
                        this.programPoint = program;
                        console.log('this.programPoint:', this.programPoint);

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {

                            const countImport = site.features.filter(
                                (f) => f.properties.obs_txt === 'import'
                            ).length;

                            this.sitePoint = site;
                            Object.assign(this.sitePoint, {
                                countImport: countImport,
                                especesTable: this.countVisitsDataByKey('espece', this.sitePoint)
                            });
                            console.log('this.sitePoint:', this.sitePoint);
                        });
                    }

                    if (program.features[0].properties.short_desc.includes('haies')) {
                        this.programLine = program;
                        console.log('this.programLine:', this.programLine);

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {

                            const countImport = site.features.filter(
                                (f) => f.properties.obs_txt === 'import'
                            ).length;

                            this.siteLine = site;
                            Object.assign(this.siteLine, {
                                countImport: countImport,
                                sumLineLength: this.computeTotalLength(this.siteLine),
                                especesTable: this.countVisitsDataByKey('espece', this.siteLine)
                            });

                            console.log('this.siteLines:', this.siteLine);
                            // this.sumLineLength = this.computeTotalLength(this.siteLine);
                        });
                    }

                    if (program.features[0].properties.short_desc.includes('zones')) {
                        this.programPolygon = program;
                        console.log('this.programZones:', this.programPolygon);

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {
                            this.sitePolygon = site;
                            console.log('this.sitePolygon:', this.sitePolygon);
                        });
                    }

                });
            }

        });
    }

    computeTotalLength(featureCollection: FeatureCollection): number {
        let total = 0;
        featureCollection.features.forEach((f) => {
            total = total + this.computeLength(f.geometry);
        });
        return total / 1000;
    }

    /**
     * Sum the linestring length in meters
     */
    computeLength(lineString: Geometry): number {
        let length = 0;
        if (lineString.type === 'LineString') {
            if (lineString.coordinates.length > 2) {
                for (let i = 1; i < lineString.coordinates.length; i++) {
                    length =
                        length + this.distance(
                            lineString.coordinates[i - 1][0],
                            lineString.coordinates[i - 1][1],
                            lineString.coordinates[i][0],
                            lineString.coordinates[i][1]
                        );
                }
            }
        }
        return length;
    }

    /**
     * Calculate the approximate distance in meters between two coordinates (lat/lon)
     *
     * © Chris Veness, MIT-licensed,
     * http://www.movable-type.co.uk/scripts/latlong.html#equirectangular
     */
    distance(λ1: number, φ1: number, λ2: number, φ2: number): number {
        const R = 6371000;
        const Δλ = (λ2 - λ1) * Math.PI / 180;
        φ1 = φ1 * Math.PI / 180;
        φ2 = φ2 * Math.PI / 180;
        const x = Δλ * Math.cos((φ1 + φ2) / 2);
        const y = φ2 - φ1;
        const d = Math.sqrt(x * x + y * y);
        return R * d;
    }

    getVisitsDataByKey(key: string, program: FeatureCollection): any[] {
        const visitsData: any[] = [];
        program.features.forEach((f) => {
            if (f.properties.hasOwnProperty('visits')) {
                if (f.properties.visits[f.properties.visits.length - 1].json_data.hasOwnProperty(key)) {
                    const data = f.properties.visits[f.properties.visits.length - 1].json_data[key];
                    visitsData.push(data);
                }
            }
        });
        return visitsData;
    } //TODO count in another function the number of especes and send back an object with [{name: 'truc', count: 2} , {name: 'troc', count: 3} ]

    countVisitsDataByKey(key: string, program: FeatureCollection): CountByKey[] {
        const data = this.getVisitsDataByKey(key, program);
        const uniqueData = data.filter((v, i, a) => a.indexOf(v) === i);
        const results = [];
        uniqueData.forEach((d) => {
            results.push({
                name: d,
                count: data.filter((v) => v === d).length,
            });
        });

        results.sort((a, b) => b.count - a.count);

        return results;
    }
}
