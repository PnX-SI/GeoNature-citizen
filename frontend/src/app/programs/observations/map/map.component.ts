import * as L from 'leaflet';
import { AppConfig } from '../../../../conf/app.config';
import {
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  HostListener,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
  } from '@angular/core';
import { Feature, FeatureCollection } from 'geojson';
import { MAP_CONFIG } from '../../../../conf/map.config';
import { MarkerClusterGroup } from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.locatecontrol';
import 'leaflet-gesture-handling';

// import { AppConfig } from '../../../../conf/app.config';



const conf = {
  MAP_ID: "obsMap",
  GEOLOCATION_HIGH_ACCURACY: false,
  BASE_LAYERS: MAP_CONFIG["BASEMAPS"].reduce((acc, baseLayer: Object) => {
    let layerConf: any = {
      name: baseLayer["name"],
      attribution: baseLayer["attribution"],
      detectRetina: baseLayer["detectRetina"],
      maxZoom: baseLayer["maxZoom"],
      bounds: baseLayer["bounds"],
      apiKey: baseLayer["apiKey"],
      layerName: baseLayer["layerName"],
    };
    if (baseLayer["subdomains"]) {
      layerConf.subdomains = baseLayer["subdomains"];
    }
    acc[baseLayer["name"]] = L.tileLayer(baseLayer["layer"], layerConf);
    return acc;
  }, {}),
  DEFAULT_BASE_MAP: () => {
    // Get a random base map to test
    /*
    return conf.BASE_LAYERS[
      Object.keys(conf.BASE_LAYERS)[
        (Math.random() * MAP_CONFIG["BASEMAP"].length) >> 0
      ]
    ];
    */
    // alert(MAP_CONFIG["DEFAULT_PROVIDER"]);
    return conf.BASE_LAYERS[MAP_CONFIG["DEFAULT_PROVIDER"]];
  },
  ZOOM_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
  GEOLOCATION_CONTROL_POSITION: "topright",
  SCALE_CONTROL_POSITION: "bottomleft",
  NEW_OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: MAP_CONFIG["NEW_OBS_POINTER"],
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: MAP_CONFIG["OBS_POINTER"],
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBSERVATION_LAYER: () =>
    L.markerClusterGroup({
      iconCreateFunction: clusters => {
        const childCount = clusters.getChildCount();
        return conf.CLUSTER_MARKER_ICON(childCount);
      }
    }),
  CLUSTER_MARKER_ICON: (childCount: number) => {
    const quantifiedCssClass = (childCount: number) => {
      let c = " marker-cluster-";
      if (childCount < 10) {
        c += "small";
      } else if (childCount < 10) {
        c += "medium";
      } else {
        c += "large";
      }
      return c;
    };
    return new L.DivIcon({
      html: `<div><span>${childCount}</span></div>`,
      className: "marker-cluster" + quantifiedCssClass(childCount),
      iconSize: new L.Point(40, 40)
    });
  },
  PROGRAM_AREA_STYLE: _feature => {
    return {
      fillColor: "transparent",
      weight: 2,
      opacity: 0.8,
      color: "red",
      dashArray: "4"
    };
  }
};

@Component({
  selector: "app-obs-map",
  template: `
    <div
      [id]="options.MAP_ID"
      #map
      i18n-data-observation-zoom-statement-warning
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre observation."
    ></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsMapComponent implements OnInit, OnChanges {
  @ViewChild("map", {static: true}) map: ElementRef;
  @Input("observations") observations: FeatureCollection;
  @Input("program") program: FeatureCollection;
  @Output() onClick: EventEmitter<L.Point> = new EventEmitter();
  options: any;
  observationMap: L.Map;
  programMaxBounds: L.LatLngBounds;
  programArea: any;
  observationLayer: MarkerClusterGroup;
  newObsMarker: L.Marker;
  markers: {
    feature: Feature;
    marker: L.Marker<any>;
  }[] = [];
  obsPopup: Feature;
  openPopupAfterClose: boolean;
  zoomAlertTimeout: any;

  constructor(
    private resolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  ngOnInit() {
    this.initMap(conf);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.observationMap &&
      changes.program &&
      changes.program.currentValue
    ) {
      this.loadProgramArea();
    }

    if (
      this.observationMap &&
      changes.observations &&
      changes.observations.currentValue
    ) {
      this.loadObservations();

      /*
      // TODO: revisit fix for disappearing base layer when back in navigation history.
      // update when switching layers from control.
      // save configured map state (base_layer, center, zoom) in localStorage ?
      let base_layer = this.observationMap.options.layers[0];
      this.observationMap.removeLayer(this.observationMap.options.layers[0]);
      conf.BASE_LAYERS[base_layer["options"]["name"]].addTo(
        this.observationMap
      );
      this.observationMap.invalidateSize();
      */
    }
  }

  initMap(options: any, LeafletOptions: L.MapOptions = {}): void {
    this.options = options;
    this.observationMap = L.map(this.map.nativeElement, {
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay ?
      gestureHandling: true,
      ...LeafletOptions
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
        position: this.options.BASE_LAYER_CONTROL_POSITION
      })
      .addTo(this.observationMap);

    L.control
      .locate({
        icon: 'fa fa-compass',
        position: this.options.GEOLOCATION_CONTROL_POSITION,
        getLocationBounds: locationEvent =>
          locationEvent.bounds.extend(this.programMaxBounds),
        locateOptions: {
          enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.observationMap);

    // this.observationMap.scrollWheelZoom.disable();
    this.observationMap.on("popupclose", _e => {
      if (this.openPopupAfterClose && this.obsPopup) {
        this.showPopup(this.obsPopup);
      } else {
        this.obsPopup = null;
      }
      this.openPopupAfterClose = false;
    });

    const ZoomViewer = L.Control.extend({
      onAdd: () => {
        let container = L.DomUtil.create("div");
        let gauge = L.DomUtil.create("div");
        container.style.width = "200px";
        container.style.background = "rgba(255,255,255,0.5)";
        container.style.textAlign = "left";
        container.className = "mb-0";
        this.observationMap.on(
          "zoomstart zoom zoomend",
          _e =>
            (gauge.innerHTML = "Zoom level: " + this.observationMap.getZoom())
        );
        container.appendChild(gauge);

        return container;
      }
    });
    let zv = new ZoomViewer();
    zv.addTo(this.observationMap);
    zv.setPosition("bottomright");
  }

  getPopupContent(feature): any {
    const factory = this.resolver.resolveComponentFactory(MarkerPopupComponent);
    const component = factory.create(this.injector);
    component.instance.data = feature.properties;
    component.changeDetectorRef.detectChanges();
    const popupContent = component.location.nativeElement;
    return popupContent;
  }

  loadObservations(): void {
    if (this.observations) {
      if (this.observationLayer) {
        this.observationMap.removeLayer(this.observationLayer);
      }
      this.observationLayer = this.options.OBSERVATION_LAYER();
      this.markers = [];

      const layerOptions = {
        onEachFeature: (feature, layer) => {
          let popupContent = this.getPopupContent(feature);

          // if (feature.properties && feature.properties.popupContent) {
          //   popupContent += feature.properties.popupContent;
          // }

          layer.bindPopup(popupContent);
        },
        pointToLayer: (_feature, latlng): L.Marker => {
          let marker: L.Marker<any> = L.marker(latlng, {
            icon: conf.OBS_MARKER_ICON()
          });
          this.markers.push({
            feature: _feature,
            marker: marker
          });
          return marker;
        }
      };

      this.observationLayer.addLayer(
        L.geoJSON(this.observations, layerOptions)
      );
      this.observationMap.addLayer(this.observationLayer);

      this.observationLayer.on("animationend", _e => {
        if (this.obsPopup) {
          this.openPopupAfterClose = true;
          this.observationMap.closePopup();
        }
      });
    }
  }

  showPopup(obs: Feature): void {
    this.obsPopup = obs;
    let marker = this.markers.find(marker => {
      return (
        marker.feature.properties.id_observation ==
        obs.properties.id_observation
      );
    });
    let visibleParent: L.Marker = this.observationLayer.getVisibleParent(
      marker.marker
    );
    if (!visibleParent) {
      this.observationMap.panTo(marker.marker.getLatLng());
      visibleParent = marker.marker;
    }
    const popup = L.popup()
      .setLatLng(visibleParent.getLatLng())
      .setContent(this.getPopupContent(obs))
      .openOn(this.observationMap);
  }

  loadProgramArea(canSubmit = true): void {
    if (this.program) {
      if (this.programArea !== undefined) {
        this.observationMap.removeLayer(this.programArea);
      };
      this.programArea = L.geoJSON(this.program, {
        style: _feature => this.options.PROGRAM_AREA_STYLE(_feature)
      }).addTo(this.observationMap);
      const programBounds = this.programArea.getBounds();
      this.observationMap.fitBounds(programBounds);
      // this.observationMap.setMaxBounds(programBounds)

      this.newObsMarker = null;
      if (canSubmit) {
        this.observationMap.on("click", (e: L.LeafletMouseEvent) => {
          let coords = L.point(e.latlng.lng, e.latlng.lat);
          if (this.newObsMarker !== null) {
            this.observationMap.removeLayer(this.newObsMarker);
          }
          let z = this.observationMap.getZoom();

          if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
            // this.hasZoomAlert = true;
            L.DomUtil.addClass(
              this.observationMap.getContainer(),
              "observation-zoom-statement-warning"
            );
            if (this.zoomAlertTimeout) {
              clearTimeout(this.zoomAlertTimeout);
            }
            this.zoomAlertTimeout = setTimeout(() => {
              L.DomUtil.removeClass(
                this.observationMap.getContainer(),
                "observation-zoom-statement-warning"
              );
            }, 2000);
            return;
          }
          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration
          // https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (programBounds.contains([e.latlng.lat, e.latlng.lng])) {
            this.newObsMarker = L.marker(e.latlng, {
              icon: this.options.NEW_OBS_MARKER_ICON()
            }).addTo(this.observationMap);
          }
          // emit new coordinates
          this.onClick.emit(coords);
        });
      }
      this.programMaxBounds = programBounds;
    }
  }

  canStart(): void { }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();
  }
}

@Component({
  selector: "popup",
  template: `
    <ng-container>
      <img class="default-img"
        [src]="
          data.image
            ? data.image
            : data.medias && !!data.medias.length
            ? AppConfig.API_TAXHUB + '/tmedias/thumbnail/' + data.medias[0].id_media + '?h=80&v=80'
            : 'assets/default_image.png'
        "
      />
      <p>
        <b i18n>{{ !!data.nom_francais ? data.nom_francais : data.taxref?.nom_vern }}</b> <br />
        <span>
        <span i18n *ngIf="AppConfig.program_list_observers_names">
          Observé par
          {{
            data.observer && data.observer.username
              ? data.observer.username
              : "Anonyme"
          }}
          <br />
          </span>
          le {{ data.date }}
        </span>
      </p>
      <div><img class="icon" src="assets/binoculars.png" /></div>
    </ng-container>
  `
})
export class MarkerPopupComponent {
  @Input() data;
  AppConfig = AppConfig;
}
