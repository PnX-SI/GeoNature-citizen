import * as L from 'leaflet';

import {
    ComponentFactoryResolver,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
    Point,
} from 'geojson';
import { MAP_CONFIG } from '../../../../../conf/map.config';
import { MarkerClusterGroup } from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import 'leaflet-gesture-handling';
import { MapService } from '../../../base/map/map.service';
import { GncProgramsService } from '../../../../api/gnc-programs.service';

export const conf = {
    MAP_ID: 'obsMap',
    GEOLOCATION_HIGH_ACCURACY: true,
    BASE_LAYERS: MAP_CONFIG['BASEMAPS'].reduce((acc, baseLayer: Object) => {
        const layerConf: any = {
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
    DEFAULT_BASE_MAP: () => conf.BASE_LAYERS[MAP_CONFIG['DEFAULT_PROVIDER']],
    ZOOM_CONTROL_POSITION: 'topleft',
    BASE_LAYER_CONTROL_POSITION: 'topleft',
    BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
    GEOLOCATION_CONTROL_POSITION: 'topleft',
    SCALE_CONTROL_POSITION: 'bottomleft',
    NEW_OBS_MARKER_ICON: () =>
        L.icon({
            iconUrl: MAP_CONFIG['NEW_OBS_POINTER'],
            iconSize: [33, 42],
            iconAnchor: [16, 42],
        }),
    AREA_MARKER_ICON: () =>
        L.icon({
            iconUrl: MAP_CONFIG['OBS_POINTER'],
            iconSize: [33, 42],
            iconAnchor: [16, 42],
        }),
    OBSERVER_MARKER_ICON: () =>
        L.icon({
            iconUrl: 'assets/user_location_d1954e.svg',
            iconSize: [33, 42],
            iconAnchor: [16, 42],
        }),
    OBSERVATION_LAYER: () =>
        L.markerClusterGroup({
            iconCreateFunction: (clusters) => {
                const childCount = clusters.getChildCount();
                return conf.CLUSTER_MARKER_ICON(childCount);
            },
        }),
    CLUSTER_MARKER_ICON: (childCount: number) => {
        const quantifiedCssClass = (childCount: number) => {
            let c = ' marker-cluster-';
            if (childCount < 10) {
                c += 'small';
            } else if (childCount >= 10 && childCount < 100) {
                c += 'medium';
            } else {
                c += 'large';
            }
            return c;
        };
        return new L.DivIcon({
            html: `<div><span>${childCount}</span></div>`,
            className: 'marker-cluster' + quantifiedCssClass(childCount),
            iconSize: new L.Point(40, 40),
        });
    },
    PROGRAM_AREA_STYLE: (_feature) => {
        return {
            fillColor: 'transparent',
            weight: 2,
            opacity: 0.8,
            color: 'red',
            dashArray: '4',
        };
    },
};

interface GNCFeatureCollection<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties
> extends FeatureCollection {
    type: 'FeatureCollection';
    count: number;
    features: Array<Feature<G, P>>;
}

export abstract class BaseMapComponent implements OnChanges {
    @ViewChild('map', { static: true }) map: ElementRef;
    @Input('features') features: GNCFeatureCollection;
    @Input('program') program: GNCFeatureCollection;
    @Output() onClick: EventEmitter<L.Point> = new EventEmitter();
    options: any;
    observationMap: L.Map;
    programMaxBounds: L.LatLngBounds;
    programArea: any;
    observationLayer: MarkerClusterGroup;
    newObsMarker: L.Circle;
    markers: {
        feature: Feature;
        marker: L.Marker<any>;
    }[] = [];
    obsPopup: Feature;
    openPopupAfterClose: boolean;
    zoomAlertTimeout: any;
    resolver: ComponentFactoryResolver;
    injector: Injector;
    mapService: MapService;
    programService: GncProgramsService;
    markerToggle = true;
    pathLines = [];

    abstract localeId: string;
    abstract feature_id_key: string;

    abstract getPopupComponentFactory(): any;

    constructor(
        resolver: ComponentFactoryResolver,
        injector: Injector,
        mapService: MapService,
        programService: GncProgramsService
    ) {
        this.resolver = resolver;
        this.injector = injector;
        this.mapService = mapService;
        this.programService = programService;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.observationMap) {
            this.initMap(conf);
            setTimeout(() => {
                if (changes.program && changes.program.currentValue) {
                    this.loadProgramArea();
                }
                if (changes.features && changes.features.currentValue) {
                    this.loadFeatures();
                }
            }, 400);
        } else {
            if (changes.program && changes.program.currentValue) {
                this.loadProgramArea();
            }
            if (changes.features && changes.features.currentValue) {
                this.loadFeatures();
            }
        }
    }

    initMap(options: any, LeafletOptions: any = {}): void {
        this.options = options;

        this.observationMap = L.map(this.map.nativeElement, {
            layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay ?
            gestureHandling: true,
            ...LeafletOptions,
        });
        // TODO: inject controls with options
        this.observationMap.zoomControl.setPosition(
            this.options.ZOOM_CONTROL_POSITION
        );

        L.control
            .scale({ position: this.options.SCALE_CONTROL_POSITION })
            .addTo(this.observationMap);

        L.control
            .layers(this.options.BASE_LAYERS, null, {
                collapsed: this.options.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                position: this.options.BASE_LAYER_CONTROL_POSITION,
            })
            .addTo(this.observationMap);

        L.control
            .locate({
                icon: 'fa fa-compass',
                position: this.options.GEOLOCATION_CONTROL_POSITION,
                strings: {
                    title: MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
                        ? MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
                        : 'Me géolocaliser',
                },
                getLocationBounds: (locationEvent) =>
                    locationEvent.bounds.extend(this.programMaxBounds),
                locateOptions: {
                    enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY,
                },
            } as any)
            .addTo(this.observationMap);

        // this.observationMap.scrollWheelZoom.disable();

        const MINZOOM = 11;
        this.observationMap.on('zoomend', (e) => {
            // Condition to check where the we go above the MINZOOM
            // to transform the Polygon to Marker
            if (e.target.getZoom() < MINZOOM && !this.markerToggle) {
                this.markerToggle = true;
                this.updateGeoJson();
                // Transforms back the Marker to Polygon
            } else if (e.target.getZoom() >= MINZOOM && this.markerToggle) {
                this.markerToggle = false;
                this.updateGeoJson();
            }
        });

        this.observationMap.on('popupclose', (_e) => {
            this.pathLines.forEach((pathLine) => {
                this.observationMap.removeLayer(pathLine);
            });
            if (this.openPopupAfterClose && this.obsPopup) {
                this.showPopup(this.obsPopup);
            } else {
                this.obsPopup = null;
            }
            this.openPopupAfterClose = false;
        });

        const ZoomViewer = L.Control.extend({
            onAdd: () => {
                const container = L.DomUtil.create('div');
                const gauge = L.DomUtil.create('div');
                container.style.width = '200px';
                container.style.background = 'rgba(255,255,255,0.5)';
                container.style.textAlign = 'left';
                container.className = 'mb-0';
                this.observationMap.on('zoomstart zoom zoomend', (_e) => {
                    gauge.innerHTML =
                        'Zoom level: ' + this.observationMap.getZoom();
                });
                container.appendChild(gauge);
                return container;
            },
        });
        const zv = new ZoomViewer();
        zv.addTo(this.observationMap);
        zv.setPosition('bottomright');

        this.observationMap.on('click', () => {
            const elemRect = this.observationMap
                .getContainer()
                .getBoundingClientRect();
            const bodyRect = document.body.getBoundingClientRect();
            const offset = elemRect.top - bodyRect.top;
            window.scrollTo(0, offset - 120); // 120 topBarre width with padding
        });

        // if (!this.program) this.loadProgramArea();
    }

    updateGeoJson() {
        if (this.observationLayer) {
            this.observationMap.removeLayer(this.observationLayer);
        }
        this.observationLayer = this.options.OBSERVATION_LAYER();
        this.observationLayer.on('animationend', (_e) => {
            if (this.obsPopup) {
                this.openPopupAfterClose = true;
                this.observationMap.closePopup();
            }
        });

        this.markers = [];

        const layerOptions = {
            onEachFeature: (feature, layer) => {
                if (feature.geometry.type === 'Polygon') {
                    const center = layer.getBounds().getCenter();

                    // latLng property allow to cluster polygons
                    layer.getLatLng = function () {
                        return center;
                    };
                    layer.setLatLng = function () {
                        return center;
                    };
                    layer._latlng = center;

                    this.markers.push({
                        feature: feature,
                        marker: layer,
                    });
                }

                const popupContent = this.getPopupContent(feature);
                layer.bindPopup(popupContent);

                layer.on({
                    click: (event) => {
                        this.programService
                            .getAreaObservers(feature.properties.id_area)
                            .toPromise()
                            .then((response) => {
                                const popup = event.target.getPopup();

                                const feature = event.target.feature;
                                feature.properties = Object.assign(
                                    event.target.feature.properties,
                                    response
                                );
                                popup.setContent(this.getPopupContent(feature));
                            });
                    },
                });
            },
            pointToLayer: (_feature, latlng): L.Marker => {
                const marker: L.Marker<any> = L.marker(latlng, {
                    icon: conf.AREA_MARKER_ICON(),
                });
                this.markers.push({
                    feature: _feature,
                    marker: marker,
                });

                return marker;
            },
        };

        const areasData = JSON.parse(JSON.stringify(this.features));
        if (this.markerToggle) {
            areasData.features = areasData.features.map((feature) => {
                if (feature.geometry.type === 'Polygon') {
                    feature.geometry = <Point>{
                        type: 'Point',
                        properties: feature.properties,
                        coordinates: feature.geometry.coordinates[0][0],
                    };
                }
                return feature;
            });
        }

        this.observationLayer.addLayer(L.geoJSON(areasData, layerOptions));
        this.observationMap.addLayer(this.observationLayer);
    }

    loadProgramArea(canSubmit = true): void {
        if (this.program) {
            if (this.programArea !== undefined) {
                this.observationMap.removeLayer(this.programArea);
            }
            this.programArea = L.geoJSON(this.program, {
                style: (_feature) => this.options.PROGRAM_AREA_STYLE(_feature),
            }).addTo(this.observationMap);
            this.programMaxBounds = this.programArea.getBounds();

            console.debug('programBounds', this.programMaxBounds);
            if (!this.features) {
                this.observationMap.fitBounds(this.programMaxBounds);
            }
            this.observationMap.setMaxBounds(this.programMaxBounds);

            this.newObsMarker = null;
            if (canSubmit) {
                this.observationMap.on('click', (e: L.LeafletMouseEvent) => {
                    const coords = L.point(e.latlng.lng, e.latlng.lat);
                    if (this.newObsMarker !== null) {
                        this.observationMap.removeLayer(this.newObsMarker);
                    }
                    const z = this.observationMap.getZoom();

                    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
                        // this.hasZoomAlert = true;
                        L.DomUtil.addClass(
                            this.observationMap.getContainer(),
                            'observation-zoom-statement-warning'
                        );
                        if (this.zoomAlertTimeout) {
                            clearTimeout(this.zoomAlertTimeout);
                        }
                        this.zoomAlertTimeout = setTimeout(() => {
                            L.DomUtil.removeClass(
                                this.observationMap.getContainer(),
                                'observation-zoom-statement-warning'
                            );
                        }, 400);
                        return;
                    }
                    // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
                    // POSSIBLE SOLUTION: See ray casting algorithm for inspiration
                    // https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
                    if (
                        this.program &&
                        this.programMaxBounds.contains([
                            e.latlng.lat,
                            e.latlng.lng,
                        ])
                    ) {
                        this.newObsMarker = L.circle(e.latlng, {
                            radius: 500,
                        }).addTo(this.observationMap);
                        this.mapService.changePoint(coords);
                    }
                    // emit new coordinates
                    this.onClick.emit(coords);
                });
            }
        } else {
            this.loadFeatures();
        }
    }

    loadFeatures(): void {
        if (!this.features) {
            return;
        }
        if (this.features.count === 1) {
            this.markerToggle = false;
        }
        this.updateGeoJson();
        if (this.features.count > 0) {
            setTimeout(() => {
                this.observationMap.fitBounds(
                    this.observationLayer.getBounds()
                );
                setTimeout(() => {
                    const newZoom = Math.min(this.observationMap.getZoom(), 15);
                    if (newZoom !== this.observationMap.getZoom()) {
                        this.observationMap.setZoom(newZoom);
                    }
                }, 200);
            }, 200);
        } else {
            const franceCenter = L.latLng(45.6659, 2.64924);
            this.observationMap.setView(franceCenter, 6);
        }
    }

    getPopupContent(feature): any {
        const factory = this.getPopupComponentFactory();
        const component = factory.create(this.injector);
        component.instance.data = feature.properties;
        component.changeDetectorRef.detectChanges();
        const popupContent = component.location.nativeElement;
        return popupContent;
    }

    showPopup(feature: Feature): void {
        this.obsPopup = feature;
        const marker = this.markers.find((marker) => {
            return (
                marker.feature.properties[this.feature_id_key] ==
                feature.properties[this.feature_id_key]
            );
        });
        let visibleParent: L.Marker = this.observationLayer.getVisibleParent(
            L.marker(marker.marker.getLatLng(), {
                icon: conf.AREA_MARKER_ICON(),
            })
        );
        if (!visibleParent) {
            this.observationMap.panTo(marker.marker.getLatLng());
            visibleParent = L.marker(marker.marker.getLatLng(), {
                icon: conf.AREA_MARKER_ICON(),
            });
        }
        L.popup()
            .setLatLng(visibleParent.getLatLng())
            .setContent(this.getPopupContent(feature))
            .openOn(this.observationMap);
    }

    ngOnDestroy(): void {
        this.observationMap.off();
        this.observationMap.remove();
    }

    canStart(): void {}
}
