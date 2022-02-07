import * as L from 'leaflet';

import {
    ComponentFactoryResolver,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from 'geojson';
import { MAP_CONFIG } from '../../../../../conf/map.config';
import { LatLngBounds, MarkerClusterGroup } from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import 'leaflet-gesture-handling';
import { MapService } from '../../../base/map/map.service';

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
            iconUrl: MAP_CONFIG['SPECIES_SITE_POINTER'],
            iconSize: [48, 48],
            iconAnchor: [24, 48],
        }),
    OBS_MARKER_ICON: () =>
        L.icon({
            iconUrl: MAP_CONFIG['SPECIES_SITE_POINTER'],
            iconSize: [48, 48],
            iconAnchor: [24, 48],
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
    @Input('updateOnNextLoad') updateOnNextLoad = false;
    @Output() onClick: EventEmitter<L.Point> = new EventEmitter();
    isFirstLoading = true;
    options: any;
    observationMap: L.Map;
    programMaxBounds: L.LatLngBounds;
    programArea: any;
    observationLayer: MarkerClusterGroup;
    markers: {
        feature: Feature;
        marker: L.Marker<any>;
    }[] = [];
    obsPopup: Feature;
    openedFeature: Feature;
    openPopupAfterClose: boolean;
    resolver: ComponentFactoryResolver;
    injector: Injector;
    mapService: MapService;

    abstract localeId: string;
    abstract feature_id_key: string;
    abstract getPopupComponentFactory(): any;

    constructor(
        resolver: ComponentFactoryResolver,
        injector: Injector,
        mapService: MapService
    ) {
        this.resolver = resolver;
        this.injector = injector;
        this.mapService = mapService;
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
                changes.features.currentValue.features.forEach((feature) => {
                    if (
                        this.openedFeature &&
                        feature &&
                        this.openedFeature.properties.id_species_site ===
                            feature.properties.id_species_site
                    ) {
                        this.showPopup(feature);
                    }
                });
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
        this.observationMap.on('popupclose', (_e) => {
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

    loadProgramArea(canSubmit = true): void {
        if (this.program) {
            if (this.programArea !== undefined) {
                this.observationMap.removeLayer(this.programArea);
            }
            let programBounds: L.LatLngBounds;
            if (this.program) {
                console.log('this.program', this.program);
                this.programArea = L.geoJSON(this.program, {
                    style: (_feature) =>
                        this.options.PROGRAM_AREA_STYLE(_feature),
                }).addTo(this.observationMap);
                programBounds = this.programArea.getBounds();
                console.debug('programBounds', programBounds);

                if (!this.features) {
                    console.log('no features', this.features);
                    this.observationMap.fitBounds(programBounds);
                }

                this.observationMap.setMaxBounds(programBounds);
            }

            if (canSubmit) {
                this.observationMap.on('click', (e: L.LeafletMouseEvent) => {
                    const coords = L.point(e.latlng.lng, e.latlng.lat);
                    // emit new coordinates
                    this.onClick.emit(coords);
                });
            }
            this.programMaxBounds = programBounds;
        } else {
            this.loadFeatures();
        }
    }

    loadFeatures(): void {
        if (this.features) {
            if (this.observationLayer) {
                this.observationMap.removeLayer(this.observationLayer);
            }
            this.observationLayer = this.options.OBSERVATION_LAYER();
            this.markers = [];

            const layerOptions = {
                onEachFeature: (feature, layer) => {
                    const popupContent = this.getPopupContent(feature);

                    // if (feature.properties && feature.properties.popupContent) {
                    //   popupContent += feature.properties.popupContent;
                    // }

                    layer.bindPopup(popupContent);
                },
                pointToLayer: (_feature, latlng): L.Marker => {
                    const marker: L.Marker<any> = L.marker(latlng, {
                        icon: conf.OBS_MARKER_ICON(),
                    });
                    this.markers.push({
                        feature: _feature,
                        marker: marker,
                    });
                    return marker;
                },
            };
            this.observationLayer.addLayer(
                L.geoJSON(this.features, layerOptions)
            );
            this.observationMap.addLayer(this.observationLayer);

            this.observationLayer.on('animationend', (_e) => {
                if (this.openedFeature) {
                    this.openedFeature = null;
                }
                if (this.obsPopup) {
                    this.openPopupAfterClose = true;
                    this.observationMap.closePopup();
                }
            });

            console.log('this.updateOnNextLoad', this.updateOnNextLoad);
            if (this.isFirstLoading || this.updateOnNextLoad) {
                this.isFirstLoading = false;
                if (this.features.count > 0) {
                    this.observationMap.fitBounds(
                        this.observationLayer.getBounds()
                    );
                    this.observationMap.setZoom(
                        Math.min(this.observationMap.getZoom(), 16)
                    );
                } else {
                    const franceCenter = L.latLng(45.6659, 2.64924);
                    this.observationMap.setView(franceCenter, 6);
                }
            }
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
        this.openedFeature = feature;
        const marker = this.markers.find((marker) => {
            return (
                marker.feature.properties[this.feature_id_key] ==
                feature.properties[this.feature_id_key]
            );
        });
        let visibleParent: L.Marker = this.observationLayer.getVisibleParent(
            L.marker(marker.marker.getLatLng(), {
                icon: conf.OBS_MARKER_ICON(),
            })
        );
        if (!visibleParent) {
            this.observationMap.panTo(marker.marker.getLatLng());
            visibleParent = L.marker(marker.marker.getLatLng(), {
                icon: conf.OBS_MARKER_ICON(),
            });
        }
        const popup = L.popup()
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
