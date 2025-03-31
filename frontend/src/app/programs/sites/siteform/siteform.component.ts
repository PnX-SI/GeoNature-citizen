import {
    Component,
    ViewEncapsulation,
    AfterViewInit,
    ViewChild,
    ElementRef,
    Input,
    LOCALE_ID,
    Inject,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
// import { map, tap } from 'rxjs/operators';

import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Position, Point } from 'geojson';
import * as L from 'leaflet';
import { BaseLayer } from '../../programs.models';
import { LeafletMouseEvent } from 'leaflet';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen';
import 'leaflet-gesture-handling';
import 'leaflet-search';
import { ControlPosition } from 'leaflet';
import { ToastrService } from 'ngx-toastr';

import { MainConfig } from '../../../../conf/main.config';
import { MapService } from '../../base/map/map.service';

// declare let $: any;

const map_conf = {
    GEOLOCATION_CONTROL_POSITION: 'topright',
    GEOLOCATION_HIGH_ACCURACY: false,
    BASE_LAYERS: MainConfig['BASEMAPS'].reduce((acc, baseLayer: BaseLayer) => {
        const layerConf: BaseLayer = {
            name: baseLayer['name'],
            attribution: baseLayer['attribution'],
            detectRetina: baseLayer['detectRetina'],
            maxZoom: baseLayer['maxZoom'],
            bounds: baseLayer['bounds'],
            apiKey: baseLayer['apiKey'],
            layerName: baseLayer['layerName'],
        };
        if (baseLayer['subdomains']) {
            layerConf.subdomains = baseLayer['subdomains'];
        }
        acc[baseLayer['name']] = L.tileLayer(baseLayer['layer'], layerConf);
        return acc;
    }, {}),
    BASE_LAYER_CONTROL_POSITION: 'topright' as ControlPosition,
    BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
    DEFAULT_BASE_MAP: () =>
        map_conf.BASE_LAYERS[MainConfig['DEFAULT_PROVIDER']],
    PROGRAM_AREA_STYLE: {
        fillColor: 'transparent',
        weight: 2,
        opacity: 0.8,
        color: 'red',
        dashArray: '4',
    },
};

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
    iconUrl: MainConfig['NEW_OBS_POINTER'],
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
    private readonly URL = MainConfig.API_ENDPOINT;
    @Input('data') data;
    @Input('coords') coords: L.Point;
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
    MainConfig = MainConfig;
    hasZoomAlert: boolean;
    zoomAlertTimeout: any;
    mapVars: any = {};

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private http: HttpClient,
        private toastr: ToastrService,
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
    }

    ngAfterViewInit(): void {
        this.http
            .get(`${MainConfig.API_ENDPOINT}/programs/${this.program_id}`)
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
                    layers: [map_conf.DEFAULT_BASE_MAP()],
                    gestureHandling: true,
                } as any);
                this.formMap = formMap;

                L.control
                    .layers(map_conf.BASE_LAYERS, null, {
                        collapsed: map_conf.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                        position: map_conf.BASE_LAYER_CONTROL_POSITION,
                    })
                    .addTo(formMap);

                L.control['fullscreen']({
                    position: 'topright',
                    title: {
                        false: 'Voir en plein écran',
                        true: 'Sortir du plein écran',
                    },
                    pseudoFullscreen: true,
                }).addTo(formMap);
                console.log('LControl', L.control);

                L.control['search']({
                    url: 'https://nominatim.openstreetmap.org/search?format=json&accept-language=fr-FR&q={s}',
                    jsonpParam: 'json_callback',
                    propertyName: 'display_name',
                    position: 'topright',
                    propertyLoc: ['lat', 'lon'],
                    markerLocation: true,
                    autoType: true,
                    autoCollapse: true,
                    minLength: 3,
                    zoom: 15,
                    text: 'Recherche...',
                    textCancel: 'Annuler',
                    textErr: 'Erreur',
                }).addTo(formMap);

                L.control
                    .locate({
                        icon: 'fa fa-location-arrow',
                        position: map_conf.GEOLOCATION_CONTROL_POSITION,
                        strings: {
                            title: MainConfig.LOCATE_CONTROL_TITLE[
                                this.localeId
                            ]
                                ? MainConfig.LOCATE_CONTROL_TITLE[this.localeId]
                                : 'Me géolocaliser',
                        },
                        getLocationBounds: (locationEvent) =>
                            locationEvent.bounds.extend(L.LatLngBounds),
                        onLocationError: (locationEvent) => {
                            let msg =
                                'Vous semblez être en dehors de la zone du programme.';
                            this.toastr.error(msg, '', {
                                positionClass: 'toast-top-right',
                            });
                            //alert("Vous semblez être en dehors de la zone du programme")
                        },
                        locateOptions: {
                            enableHighAccuracy:
                                map_conf.GEOLOCATION_HIGH_ACCURACY,
                        },
                    } as any)
                    .addTo(formMap);

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

                // Set initial observation marker from main map if already spotted
                let myMarker = null;
                if (this.coords) {
                    const geo_coords = <Point>{
                        type: 'Point',
                        coordinates: <Position>[this.coords.x, this.coords.y],
                    };
                    this.siteForm.patchValue({ geometry: geo_coords });

                    myMarker = L.marker([this.coords.y, this.coords.x], {
                        icon: siteFormMarkerIcon,
                    }).addTo(formMap);
                }

                // Update marker on click event
                formMap.on('click', (e: LeafletMouseEvent) => {
                    let z = formMap.getZoom();

                    if (z < MainConfig.ZOOM_LEVEL_RELEVE) {
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
                        myMarker = L.marker(e.latlng, {
                            icon: siteFormMarkerIcon,
                        }).addTo(formMap);
                        this.coords = L.point(e.latlng.lng, e.latlng.lat);
                        const coords = <Point>{
                            type: 'Point',
                            coordinates: <Position>[e.latlng.lng, e.latlng.lat],
                        };
                        this.siteForm.patchValue({ geometry: coords });
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
            geometry: this.data.coords
                ? <Point>{
                      type: 'Point',
                      coordinates: <Position>[this.coords.x, this.coords.y],
                  }
                : '',
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
