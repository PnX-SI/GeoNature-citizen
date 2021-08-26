import {
    Component,
    ViewEncapsulation,
    AfterViewInit,
    ViewChild,
    ElementRef,
    Input,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
// import { map, tap } from 'rxjs/operators';

import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Position, Point, LineString } from 'geojson';
import * as L from 'leaflet';
import { LeafletMouseEvent } from 'leaflet';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen';
import 'leaflet-gesture-handling';

import { AppConfig } from '../../../../conf/app.config';
import { MAP_CONFIG } from '../../../../conf/map.config';
import { MapService } from '../../base/map/map.service';

// declare let $: any;

const PROGRAM_AREA_STYLE = {
    fillColor: 'transparent',
    weight: 2,
    opacity: 0.8,
    color: 'red',
    dashArray: '4',
};

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const siteFormMarkerIcon = L.icon({
    iconUrl: 'assets/pointer-blue2.png', // TODO: Asset path should be normalized, conf ?
    iconAnchor: [16, 42],
});
export const myMarkerTitle =
    '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
    selector: 'app-site-form',
    templateUrl: './siteform.component.html',
    styleUrls: ['./siteform.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SiteFormComponent implements AfterViewInit {
    private readonly URL = AppConfig.API_ENDPOINT;
    @Input('data') data;
    @Input('coords') coords: L.Point;
    @Input('line') line: L.Polyline;
    @Input('program_id') program_id: number;
    @ViewChild('photo', { static: true }) photo: ElementRef;
    program: any;
    site_types: any;
    formMap: L.Map;
    siteForm = new FormGroup({
        name: new FormControl('', Validators.required),
        geometry: new FormControl('', Validators.required),
        id_program: new FormControl(),
        id_type: new FormControl('', Validators.required),
        id_site: new FormControl(),
    });
    MAP_CONFIG = MAP_CONFIG;
    hasZoomAlert: boolean;
    zoomAlertTimeout: any;
    mapVars: any = {};

    constructor(
        private http: HttpClient,
        private mapService: MapService,
        private dateParser: NgbDateParserFormatter
    ) {}

    ngOnInit(): void {
        if (this.data.updateData) {
            this.patchForm(this.data.updateData);
        }
 
        this.mapService.coordsChange.subscribe((value) => {
            this.coords = value;

            const geo_coords = <Point>{
                type: 'Point',
                coordinates: <Position>[this.coords.x, this.coords.y],
            };
            this.siteForm.patchValue({ geometry: geo_coords });
            if (this.mapVars.minimapMarker)
                this.formMap.removeLayer(this.mapVars.minimapMarker);
            this.mapVars.minimapMarker = L.marker(
                [this.coords.y, this.coords.x],
                {
                    icon: siteFormMarkerIcon,
                }
            ).addTo(this.formMap);
        });

        this.mapService.lineChange.subscribe((value) => {
            this.line = value;
        });
    }

    ngAfterViewInit(): void {
        this.http
            .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
            .subscribe((result) => {
                this.program = result;
                this.site_types = this.program.features[0].site_types;
                console.debug('site_types', this.site_types);
                console.debug('prev', this.siteForm);
                if (this.site_types.length == 1) {
                    this.siteForm.patchValue({
                        id_type: this.site_types[0].value,
                    });
                }
                console.debug('post', this.siteForm);

                // build map control
                const formMap = L.map('formMap', {
                    gestureHandling: true,
                } as any);
                this.formMap = formMap;

                L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap',
                }).addTo(formMap);

                L.control['fullscreen']({
                    position: 'topright',
                    title: {
                        false: 'View Fullscreen',
                        true: 'Exit Fullscreen',
                    },
                }).addTo(formMap);

                const ZoomViewer = L.Control.extend({
                    onAdd: () => {
                        const container = L.DomUtil.create('div');
                        const gauge = L.DomUtil.create('div');
                        container.style.width = '200px';
                        container.style.background = 'rgba(255,255,255,0.5)';
                        container.style.textAlign = 'left';
                        container.className = 'mb-0';
                        formMap.on('zoomstart zoom zoomend', function (_e) {
                            gauge.innerHTML =
                                'Zoom level: ' + formMap.getZoom();
                        });
                        container.appendChild(gauge);

                        return container;
                    },
                });
                const zv = new ZoomViewer();
                zv.addTo(formMap);
                zv.setPosition('bottomleft');

                const programArea = L.geoJSON(this.program, {
                    style: function (_feature) {
                        return PROGRAM_AREA_STYLE;
                    },
                }).addTo(formMap);

                const maxBounds: L.LatLngBounds = programArea.getBounds();
                formMap.fitBounds(maxBounds);
                formMap.setMaxBounds(maxBounds);

                const geometryType = this.program.features[0].properties.geometry_type;
                let myMarker = null;
                let myLine = null;
                let geo_coords = null;

                if (this.coords || this.line) { // Set initial observation marker from main map if already spotted
                    switch (geometryType) {
                        case 'POINT': //TODO case POLYGON
                        default:
                            geo_coords = <Point>{
                                type: 'Point',
                                coordinates: <Position>[this.coords.x, this.coords.y],
                            };
                            this.siteForm.patchValue({ geometry: geo_coords });
                            myMarker = L.marker([this.coords.y, this.coords.x], {
                                icon: siteFormMarkerIcon,
                            }).addTo(formMap);
                            break;

                        case 'LINESTRING':
                            const coordinates = this.line.getLatLngs() as L.LatLng[];
                            const positions: Position[] = coordinates.map(c => [c.lat, c.lng])
                            geo_coords = <LineString>{
                                type: 'LineString',
                                coordinates: <Position[]>positions,
                            };
                            this.siteForm.patchValue({ geometry: geo_coords });
                            myLine = L.polyline(coordinates, {
                                color: '#11aa9e',
                            }).addTo(formMap);
                            break;
                    }
                }

                // Update marker on click event
                formMap.on('click', (e: LeafletMouseEvent) => {
                    const z = formMap.getZoom();

                    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
                        // this.hasZoomAlert = true;
                        console.debug('ZOOM ALERT', formMap);
                        L.DomUtil.addClass(
                            formMap.getContainer(),
                            'observation-zoom-statement-warning'
                        );
                        if (this.zoomAlertTimeout) {
                            clearTimeout(this.zoomAlertTimeout);
                        }
                        this.zoomAlertTimeout = setTimeout(() => {
                            L.DomUtil.removeClass(
                                formMap.getContainer(),
                                'observation-zoom-statement-warning'
                            );
                            console.debug('Deactivating overlay', formMap);
                        }, 2000);
                        return;
                    }

                    switch (geometryType) {
                        case 'POINT':
                        default:
                            // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
                            // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
                            if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
                                if (myMarker) {
                                    // TODO: update marker coods inplace.
                                    // Implement draggable marker
                                    formMap.removeLayer(myMarker);
                                }
                                myMarker = L.marker(e.latlng, {
                                    icon: siteFormMarkerIcon,
                                }).addTo(formMap);
                                //this.coords = L.point(e.latlng.lng, e.latlng.lat);
                                // this.siteForm.patchValue({ geometry: this.coords });
                                const coords = <Point>{
                                    type: 'Point',
                                    coordinates: <Position>[e.latlng.lng, e.latlng.lat],
                                };
                                this.siteForm.patchValue({ geometry: coords });
                            }
                            break;

                        case 'LINESTRING':
                            // UPDATE on the form map not allowed at the moment!
                            break;

                    }
                });

                this.mapVars = {
                    minimapMarker: myMarker,
                };
            });
    }

    patchForm(updateData): void {
        this.siteForm.patchValue({
            name: updateData.name,
            geometry: this.data.coords ? this.coords : '',
            id_type: updateData.id_type,
            id_program: updateData.program_id,
            id_site: updateData.id_site,
        });
    }

    onFormSubmit(): Promise<object> {
        console.debug('formValues:', this.siteForm.value);
        return this.postSite()
            .toPromise()
            .then(
                (data) => {
                    return data;
                },
                (err) => console.error(err)
            );
    }

    postSite(): Observable<any> {
        const httpOptions = {
            headers: new HttpHeaders({
                Accept: 'application/json',
            }),
        };
        if (this.data.updateData) {
            return this.http.patch<any>(
                `${this.URL}/sites/`,
                this.siteForm.value,
                httpOptions
            );
        } else {
            this.siteForm.patchValue({
                id_program: this.program_id,
            });
            return this.http.post<any>(
                `${this.URL}/sites/`,
                this.siteForm.value,
                httpOptions
            );
        }
    }
}
