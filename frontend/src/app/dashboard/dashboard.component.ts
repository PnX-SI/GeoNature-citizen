import * as L from 'leaflet';
import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from '../../conf/app.config';
import { Title } from '@angular/platform-browser';
import { GncProgramsService } from '../api/gnc-programs.service';
import { FeatureCollection, Geometry, Feature, Polygon, Position } from 'geojson';
import { Program } from '../programs/programs.models';
import { dashboardData, dashboardDataType } from '../../conf/dashboard.config';
import { conf } from '../programs/base/map/map.component';
import { MAP_CONFIG } from '../../conf/map.config';

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
export class DashboardComponent implements AfterViewInit {
    dashboardData: dashboardDataType;
    programs: Program[];
    sitePoint: ExtraFeatureCollection;
    siteLine: ExtraFeatureCollection;
    sitePolygon: ExtraFeatureCollection;
    programPoint: FeatureCollection;
    programLine: FeatureCollection;
    programPolygon: FeatureCollection;
    layerPoint: L.Layer;
    layerLine: L.Layer;
    layerPolygon: L.Layer;
    showLayerPoint: boolean;
    showLayerLine: boolean;
    showLayerPolygon: boolean;
    showMapLarge: boolean;
    dashboardMap: L.Map;
    options: any;
    constructor(
        private router: Router,
        private titleService: Title,
        private programService: GncProgramsService
    ) { }

    ngAfterViewInit(): void {

        this.dashboardData = dashboardData;

        this.titleService.setTitle(`${AppConfig.appName} - tableau de bord`);

        this.programService.getAllPrograms().subscribe((programs) => {
            this.programs = programs;
            console.log('this.programs: ', this.programs);

            const mapContainer = document.getElementById('dashboardMap');

            if (mapContainer) {
                this.initMap(conf);
            }

            for (let p of this.programs) {
                console.log('p', p)
                this.programService.getProgram(p.id_program).subscribe((program) => {
                    if (p.geometry_type === 'POINT' && p.id_project === 1) {
                        this.programPoint = program;
                        console.log('this.programPoint:', this.programPoint);

                        if (this.programPoint) {
                            this.addProgramLayer(this.programPoint);
                        }

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {

                            const countImport = site.features.filter(
                                (f) => f.properties.obs_txt === 'import' || f.properties.obs_txt === 'géoportail wallon'
                            ).length;

                            this.sitePoint = site;
                            Object.assign(this.sitePoint, {
                                countImport: countImport,
                                especesTable: this.countVisitsDataByKey('espece', this.sitePoint)
                            });
                            console.log('this.sitePoint:', this.sitePoint);

                            this.addLayerToMap(this.sitePoint);
                        });
                    }

                    if (p.geometry_type === 'LINESTRING' && p.id_project === 1) {
                        this.programLine = program;
                        console.log('this.programLine:', this.programLine);

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {

                            this.siteLine = site;
                            Object.assign(this.siteLine, {
                                countImport: this.countImport(this.siteLine),
                                sumLineLength: this.computeTotalLength(this.siteLine),
                                especesTable: this.countVisitsDataByKey('espece', this.siteLine)
                            });

                            console.log('this.siteLines:', this.siteLine);

                            this.addLayerToMap(this.siteLine);
                        });
                    }

                    if (p.geometry_type === 'POLYGON' && p.id_project === 1) {
                        this.programPolygon = program;
                        console.log('this.programZones:', this.programPolygon);

                        this.programService.getProgramSites(p.id_program).subscribe((site) => {
                            this.sitePolygon = site;
                            console.log('this.sitePolygon:', this.sitePolygon);
                            Object.assign(this.sitePolygon, {
                                countImport: this.countImport(this.sitePolygon),
                                sumArea: this.computeTotalArea(this.sitePolygon),
                            });

                            this.addLayerToMap(this.sitePolygon);
                        });
                    }
                });
            }

        });
    }


    countImport(featureCollection: FeatureCollection): number {
        return featureCollection.features.filter(
            (f) => f.properties.obs_txt === 'import' || f.properties.obs_txt === 'géoportail wallon'
        ).length;
    }

    computeArea(coordinates: Position[][]): number {
        // from https://github.com/mapbox/geojson-area

        const RADIUS = 6378137;

        /**
         * Calculate the approximate area of the polygon were it projected onto
         *     the earth.  Note that this area will be positive if ring is oriented
         *     clockwise, otherwise it will be negative.
         *
         * Reference:
         * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
         *     Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
         *     Laboratory, Pasadena, CA, June 2007 http://trs-new.jpl.nasa.gov/dspace/handle/2014/40409
         *
         * Returns:
         * {float} The approximate signed geodesic area of the polygon in square
         *     meters.
         */

        const ringArea = (coords): number => {
            let p1, p2, p3, lowerIndex, middleIndex, upperIndex, i,
            area = 0,
            coordsLength = coords.length;

            if (coordsLength > 2) {
                for (i = 0; i < coordsLength; i++) {
                    if (i === coordsLength - 2) {// i = N-2
                        lowerIndex = coordsLength - 2;
                        middleIndex = coordsLength - 1;
                        upperIndex = 0;
                    } else if (i === coordsLength - 1) {// i = N-1
                        lowerIndex = coordsLength - 1;
                        middleIndex = 0;
                        upperIndex = 1;
                    } else { // i = 0 to N-3
                        lowerIndex = i;
                        middleIndex = i + 1;
                        upperIndex = i + 2;
                    }
                    p1 = coords[lowerIndex];
                    p2 = coords[middleIndex];
                    p3 = coords[upperIndex];
                    area += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
                }

                area = area * RADIUS * RADIUS / 2;
            }

            return area;
        };

        const rad = (_): number => {
            return _ * Math.PI / 180;
        };

        const polygonArea = (coords): number => {
            let area = 0;
            if (coords && coords.length > 0) {
                area += Math.abs(ringArea(coords[0]));
                for (let i = 1; i < coords.length; i++) {
                    area -= Math.abs(ringArea(coords[i]));
                }
            }
            return area;
        };

        return polygonArea(coordinates);
    }

    /**
     * Sum the polygon area in ha
     */
    computeTotalArea(featureCollection: FeatureCollection): number {
        let total = 0;
        console.log(featureCollection.features);

        featureCollection.features.forEach((f) => {
            const geom = f.geometry as Polygon;
            total = total + this.computeArea(geom.coordinates);
        });
        return total / 10000;
    }

    /**
     * Sum the line length in km
     */
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

    initMap(options: any, LeafletOptions: any = {}): void {

        this.options = options;

        this.dashboardMap = L.map('dashboardMap', {
            layers: [this.options.DEFAULT_BASE_MAP()],
            ...LeafletOptions,
        });

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

        this.showMapLarge = false;
    }

    addProgramLayer(features: FeatureCollection): void {
        const programLayer = L.geoJSON(features, {
            style: (_feature) => this.options.PROGRAM_AREA_STYLE(_feature),
        }).addTo(this.dashboardMap);
        const programBounds = programLayer.getBounds();
        this.dashboardMap.fitBounds(programBounds);
    }

    addLayerToMap(features: FeatureCollection): void {
        const layerOptions = {
            onEachFeature: (feature, layer) => {
                const popupContent = this.getPopupContent(feature);
                layer.bindPopup(popupContent);
            },
        };

        const geometryType = features.features[0].geometry.type.toUpperCase();
        switch (geometryType) {
            case 'POINT':
            default:
                Object.assign(layerOptions, {
                    pointToLayer: (f: Feature, latlng): L.Marker => {
                        const marker: L.Marker<any> = L.marker(latlng, {
                            icon:
                                f.properties.obs_txt === 'import' || f.properties.obs_txt === 'géoportail wallon'
                                    ? conf.ORANGE_MARKER_ICON()
                                    : conf.OBS_MARKER_ICON(),
                        });
                        return marker;
                    },
                });
                this.layerPoint = L.geoJSON(features, layerOptions);
                this.dashboardMap.addLayer(this.layerPoint);
                this.showLayerPoint = true;
                break;

            case 'LINESTRING':
                Object.assign(layerOptions, {
                    style: (f: Feature) =>
                        f.properties.obs_txt === 'import' || f.properties.obs_txt === 'géoportail wallon'
                            ? { color: '#ff6600' }
                            : { color: '#11aa9e' }
                });
                this.layerLine = L.geoJSON(features, layerOptions);
                this.dashboardMap.addLayer(this.layerLine);
                this.showLayerLine = true;
                break;

            case 'POLYGON':
                Object.assign(layerOptions, {
                    style: (f: Feature) =>
                        f.properties.obs_txt === 'import' || f.properties.obs_txt === 'géoportail wallon'
                            ? { color: '#ff6600' }
                            : { color: '#11aa25' }
                });
                this.layerPolygon = L.geoJSON(features, layerOptions);
                this.dashboardMap.addLayer(this.layerPolygon);
                this.showLayerPolygon = true;
                break;
        }

        this.dashboardMap.setView(
            [this.dashboardData.base.lat, this.dashboardData.base.lon],
            11
        );
    }

    getPopupContent(feature: Feature): string {
        let content = `<div></div>`;
        content =
            content +
            `<p class="dashboard-popup">${feature.properties.name} <i>par</i> ${feature.properties.obs_txt}</p>`;
        content =
            content +
            `<div>
            <a target="_blank" href=/fr/programs/${feature.properties.id_program}/sites/${feature.properties.id_site}><img class="icon" src="assets/binoculars.png"></a>
        </div>`;

        return content;
    }

    togglePointLayer(): void {
        if (this.showLayerPoint) {
            this.dashboardMap.removeLayer(this.layerPoint);
            this.showLayerPoint = false;
        } else {
            this.dashboardMap.addLayer(this.layerPoint);
            this.showLayerPoint = true;
        }
    }

    toggleLineLayer(): void {
        if (this.showLayerLine) {
            this.dashboardMap.removeLayer(this.layerLine);
            this.showLayerLine = false;
        } else {
            this.dashboardMap.addLayer(this.layerLine);
            this.showLayerLine = true;
        }
    }

    togglePolygonLayer(): void {
        if (this.showLayerPolygon) {
            this.dashboardMap.removeLayer(this.layerPolygon);
            this.showLayerPolygon = false;
        } else {
            this.dashboardMap.addLayer(this.layerPolygon);
            this.showLayerPolygon = true;
        }
    }

    toggleMapLarge(): void {
        setTimeout(() => {
            this.dashboardMap.invalidateSize();
        }, 400);
        if (this.showMapLarge) {
            this.showMapLarge = false;
        } else {
            this.showMapLarge = true;
        }
    }

    print(): void {
        // open all the details html tag
        const detailsTags = document.querySelectorAll('details');
        for (let i = 0; i < detailsTags.length; i++) {
            const d = detailsTags[i];
            d.setAttribute('open', 'true');
        }
        this.showMapLarge = true;
        setTimeout(() => {
            this.dashboardMap.invalidateSize();
        }, 400);
        setTimeout(() => {
            window.print();
        }, 400);
    }
}