import {
    Component,
    ViewEncapsulation,
    AfterViewInit,
    ViewChild,
    ElementRef,
    Input,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
// import { map, tap } from 'rxjs/operators';

import { Position, Point } from 'geojson';
import * as L from 'leaflet';
import { LeafletMouseEvent } from 'leaflet';
import 'leaflet-gesture-handling';

import { AppConfig } from '../../../../../conf/app.config';
import { MAP_CONFIG } from '../../../../../conf/map.config';
import { MapService } from '../../../base/map/map.service';
import { GNCFrameworkComponent } from '../../../base/jsonform/framework/framework.component';
import { conf } from '../../species_sites/map/map.component';
import { ControlPosition } from 'leaflet/index';

const AREA_STYLE = {
    fillColor: 'transparent',
    weight: 2,
    opacity: 0.8,
    color: 'red',
    dashArray: '4',
};

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const areaFormMarkerIcon = L.icon({
    iconUrl: 'assets/pointer-blue2.png', // TODO: Asset path should be normalized, conf ?
    iconAnchor: [16, 42],
});
export const myMarkerTitle =
    '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
    selector: 'app-area-form',
    templateUrl: './areaform.component.html',
    styleUrls: ['./areaform.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AreaFormComponent implements AfterViewInit {
    private readonly URL = AppConfig.API_ENDPOINT;
    @Input('data') data;
    @Input('coords') coords: L.Point;
    @Input('program_id') program_id: number;
    @ViewChild('photo', { static: true }) photo: ElementRef;
    program: any;
    formMap: L.Map;
    areaForm = new FormGroup({
        name: new FormControl('', Validators.required),
        geometry: new FormControl('', Validators.required),
        id_program: new FormControl(),
        id_area: new FormControl(),
    });
    MAP_CONFIG = MAP_CONFIG;
    hasZoomAlert: boolean;
    zoomAlertTimeout: any;
    mapVars: any = {};

    jsonData: object = {};
    formOptions: any = {
        loadExternalAssets: false,
        debug: false,
        returnEmptyFields: false,
        addSubmit: false,
    };
    jsonSchema: any = {};
    GNCBootstrap4Framework: any = {
        framework: GNCFrameworkComponent,
    };
    formInputObject: object;
    readyToDisplay = false;
    partialLayout: any[] = [];
    advancedMode = false;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private http: HttpClient,
        private mapService: MapService
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
            this.areaForm.patchValue({ geometry: geo_coords });
            if (this.mapVars.minimapMarker)
                this.formMap.removeLayer(this.mapVars.minimapMarker);
            this.mapVars.minimapMarker = L.marker(
                [this.coords.y, this.coords.x],
                {
                    icon: areaFormMarkerIcon,
                }
            ).addTo(this.formMap);
        });

        this.loadJsonSchema().subscribe((data: any) => {
            this.initForm(data);
        });
    }

    initForm(json_schema) {
        this.jsonSchema = json_schema;
        this.updatePartialLayout();
        this.updateFormInput();
        this.readyToDisplay = true;
    }
    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/areas/program/${this.program_id}/jsonschema`
        );
    }
    updateFormInput() {
        this.updatePartialLayout();
        this.formInputObject = {
            schema: this.jsonSchema.schema,
            data: this.jsonData,
            layout: this.partialLayout,
        };
    }
    updatePartialLayout() {
        this.partialLayout = this.jsonSchema.layout;
        this.partialLayout[this.partialLayout.length - 1].expanded =
            this.advancedMode;
    }
    yourOnChangesFn(e) {
        this.jsonData = e;
    }

    ngAfterViewInit(): void {
        this.http
            .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
            .subscribe((result) => {
                this.program = result;
                console.debug('areaForm', this.areaForm);

                // build map control
                const formMap = L.map('formMap', {
                    gestureHandling: true,
                } as any);
                this.formMap = formMap;

                L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap',
                }).addTo(formMap);

                L.control
                    .layers(conf.BASE_LAYERS, null, {
                        collapsed: conf.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                        position:
                            conf.BASE_LAYER_CONTROL_POSITION as ControlPosition,
                    })
                    .addTo(this.formMap);

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
                        return AREA_STYLE;
                    },
                }).addTo(formMap);

                const maxBounds: L.LatLngBounds = programArea.getBounds();

                L.control
                    .locate({
                        icon: 'fa fa-compass',
                        position: 'topleft',
                        strings: {
                            title: MAP_CONFIG.LOCATE_CONTROL_TITLE[
                                this.localeId
                            ]
                                ? MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
                                : 'Me géolocaliser',
                        },
                        getLocationBounds: (locationEvent) =>
                            locationEvent.bounds.extend(maxBounds),
                        locateOptions: {
                            enableHighAccuracy: true,
                        },
                    } as any)
                    .addTo(formMap);

                formMap.fitBounds(maxBounds);
                formMap.setMaxBounds(maxBounds);

                // Set initial observation marker from main map if already spotted
                let myMarker = null;
                if (this.coords) {
                    const geo_coords = <Point>{
                        type: 'Point',
                        coordinates: <Position>[this.coords.x, this.coords.y],
                    };
                    this.areaForm.patchValue({ geometry: geo_coords });

                    myMarker = L.circle([this.coords.y, this.coords.x], {
                        radius: 500,
                    }).addTo(formMap);

                    const maxBounds = myMarker.getBounds();
                    formMap.fitBounds(maxBounds);
                    formMap.setMaxBounds(maxBounds);
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
                    // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
                    // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
                    if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
                        if (myMarker) {
                            // TODO: update marker coods inplace.
                            // Implement draggable marker
                            formMap.removeLayer(myMarker);
                        }

                        myMarker = L.circle(e.latlng, {
                            radius: 500,
                        }).addTo(formMap);

                        // myMarker = L.marker(e.latlng, {
                        //     icon: areaFormMarkerIcon,
                        // }).addTo(formMap);
                        this.coords = L.point(e.latlng.lng, e.latlng.lat);
                        // this.areaForm.patchValue({ geometry: this.coords });
                        const coords = <Point>{
                            type: 'Point',
                            coordinates: <Position>[e.latlng.lng, e.latlng.lat],
                        };
                        this.areaForm.patchValue({ geometry: coords });
                    }
                });
                this.mapVars = {
                    minimapMarker: myMarker,
                };
            });
    }

    patchForm(updateData): void {
        this.areaForm.patchValue({
            name: updateData.name,
            geometry: this.data.coords ? this.coords : '',
            id_program: updateData.program_id,
            id_area: updateData.id_area,
        });
        this.jsonData = updateData.json_data;
    }

    onFormSubmit(): Promise<object> {
        console.debug('formValues:', this.areaForm.value);

        const formData = this.areaForm.value;
        if (this.jsonData) {
            formData.json_data = JSON.stringify(this.jsonData);
        }
        return this.postArea(formData)
            .toPromise()
            .then(
                (data) => {
                    return data;
                },
                (err) => console.error(err)
            );
    }

    postArea(postData): Observable<any> {
        const httpOptions = {
            headers: new HttpHeaders({
                Accept: 'application/json',
            }),
        };
        if (this.data.updateData) {
            return this.http.patch<any>(
                `${this.URL}/areas/`,
                postData,
                httpOptions
            );
        } else {
            postData.id_program = this.program_id;
            return this.http.post<any>(
                `${this.URL}/areas/`,
                postData,
                httpOptions
            );
        }
    }
}
