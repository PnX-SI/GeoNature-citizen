import {
  Component,
  ViewEncapsulation,
  OnInit,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  ViewChild,
  ElementRef,
  ComponentFactoryResolver,
  Injector
} from "@angular/core";

import { FeatureCollection, Feature } from "geojson";
import * as L from "leaflet";
import "leaflet.markercluster";
import "leaflet.locatecontrol";
import "leaflet-gesture-handling";

import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";
import { MarkerClusterGroup } from "leaflet";

const conf = {
  MAP_ID: "obsMap",
  GEOLOCATION_HIGH_ACCURACY: false,
  BASE_LAYERS: MAP_CONFIG["BASEMAPS"].reduce((acc, baseLayer: Object) => {
    acc[baseLayer["name"]] = L.tileLayer(baseLayer["layer"], {
      name: baseLayer["name"],
      attribution: baseLayer["attribution"],
      subdomains: baseLayer["subdomains"],
      detectRetina: baseLayer["detectRetina"],
      maxZoom: baseLayer["maxZoom"],
      bounds: baseLayer["bounds"]
    });
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
  ZOOM_CONTROL_POSITION: "topleft",
  BASE_LAYER_CONTROL_POSITION: "topleft",
  BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
  GEOLOCATION_CONTROL_POSITION: "topleft",
  SCALE_CONTROL_POSITION: "bottomleft",
  NEW_OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: "assets/pointer-blue2.png",
      iconSize: [33, 42],
      iconAnchor: [16, 42]
    }),
  OBS_MARKER_ICON: () =>
    L.icon({
      iconUrl: "assets/pointer-green.png",
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
  selector: "app-sites-map",
  template: `
    <div
      [id]="options.MAP_ID"
      #map
      i18n-data-observation-zoom-statement-warning
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre site."
    ></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SitesMapComponent implements OnInit, OnChanges {
  @ViewChild("map") map: ElementRef;
  @Input("sites") sites: FeatureCollection;
  @Input("program") program: FeatureCollection;
  @Output() onClick: EventEmitter<L.Point> = new EventEmitter();
  options: any;
  sitesMap: L.Map;
  programMaxBounds: L.LatLngBounds;
  siteLayer: MarkerClusterGroup;
  newSiteMarker: L.Marker;
  markers: {
    feature: Feature;
    marker: L.Marker<any>;
  }[] = [];
  sitePopup: Feature;
  openPopupAfterClose: boolean;
  zoomAlertTimeout: any;

  constructor(
    private resolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  ngOnInit() {
    this.initMap(conf);
    var that = this;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.sitesMap &&
      changes.program &&
      changes.program.currentValue
    ) {
      console.debug("SitesMapComponent::program OnChanges:", changes);
      this.loadProgramArea();
    }

    if (
      this.sitesMap &&
      changes.sites &&
      changes.sites.currentValue
    ) {
      console.debug("SitesMapComponent::sites OnChanges:", changes);
      this.loadSites();

      /*
      // TODO: revisit fix for disappearing base layer when back in navigation history.
      // update when switching layers from control.
      // save configured map state (base_layer, center, zoom) in localStorage ?
      let base_layer = this.sitesMap.options.layers[0];
      // console.debug(base_layer["options"]["name"]);
      this.sitesMap.removeLayer(this.sitesMap.options.layers[0]);
      conf.BASE_LAYERS[base_layer["options"]["name"]].addTo(
        this.sitesMap
      );
      this.sitesMap.invalidateSize();
      */
      // fix for disappearing base layer when back in navigation history
      let base_layer = this.sitesMap.options.layers[0]
      this.sitesMap.removeLayer(base_layer);
      this.sitesMap.addLayer(base_layer);
      // end fix
    }
  }

  initMap(options: any, LeafletOptions: L.MapOptions = {}): void {
    var that = this;
    this.options = options;
    this.sitesMap = L.map(this.map.nativeElement, {
      layers: [this.options.DEFAULT_BASE_MAP()], // TODO: add program overlay ?
      gestureHandling: true,
      ...LeafletOptions
    });

    // TODO: inject controls with options
    this.sitesMap.zoomControl.setPosition(
      this.options.ZOOM_CONTROL_POSITION
    );

    L.control
      .scale({ position: this.options.SCALE_CONTROL_POSITION })
      .addTo(this.sitesMap);

    L.control
      .layers(this.options.BASE_LAYERS, null, {
        collapsed: this.options.BASE_LAYER_CONTROL_INIT_COLLAPSED,
        position: this.options.BASE_LAYER_CONTROL_POSITION
      })
      .addTo(this.sitesMap);

    L.control
      .locate({
        position: this.options.GEOLOCATION_CONTROL_POSITION,
        getLocationBounds: locationEvent =>
          locationEvent.bounds.extend(this.programMaxBounds),
        locateOptions: {
          enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.sitesMap);

    // this.sitesMap.scrollWheelZoom.disable();
    this.sitesMap.on("popupclose", _e => {
      if (this.openPopupAfterClose && this.sitePopup) {
        this.showPopup(this.sitePopup);
      } else {
        this.sitePopup = null;
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
        this.sitesMap.on(
          "zoomstart zoom zoomend",
          _e =>
            (gauge.innerHTML = "Zoom level: " + this.sitesMap.getZoom())
        );
        container.appendChild(gauge);

        return container;
      }
    });
    let zv = new ZoomViewer();
    zv.addTo(this.sitesMap);
    zv.setPosition("bottomright");
  }

  loadSites(): void {
    if (this.sites) {
      if (this.siteLayer) {
        this.sitesMap.removeLayer(this.siteLayer);
      }
      this.siteLayer = this.options.OBSERVATION_LAYER();
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

      this.siteLayer.addLayer(
        L.geoJSON(this.sites, layerOptions)
      );
      this.sitesMap.addLayer(this.siteLayer);

      this.siteLayer.on("animationend", _e => {
        if (this.sitePopup) {
          this.openPopupAfterClose = true;
          this.sitesMap.closePopup();
        }
      });
    }
  }

  getPopupContent(feature): any {
    const factory = this.resolver.resolveComponentFactory(SiteMarkerPopupComponent);
    const component = factory.create(this.injector);
    component.instance.data = feature.properties;
    component.instance.env = {
      AppConfig: AppConfig
    };
    component.changeDetectorRef.detectChanges();
    const popupContent = component.location.nativeElement;
    return popupContent;
  }

  showPopup(site: Feature): void {
    this.sitePopup = site;
    let marker = this.markers.find(marker => {
      return (
        marker.feature.properties.id_site ==
        site.properties.id_site
      );
    });
    let visibleParent: L.Marker = this.siteLayer.getVisibleParent(
      marker.marker
    );
    if (!visibleParent) {
      this.sitesMap.panTo(marker.marker.getLatLng());
      visibleParent = marker.marker;
    }
    const popup = L.popup()
      .setLatLng(visibleParent.getLatLng())
      .setContent(this.getPopupContent(site))
      .openOn(this.sitesMap);
  }

  loadProgramArea(canSubmit = true): void {
    if (this.program) {
      const programArea = L.geoJSON(this.program, {
        style: _feature => this.options.PROGRAM_AREA_STYLE(_feature)
      }).addTo(this.sitesMap);
      const programBounds = programArea.getBounds();
      this.sitesMap.fitBounds(programBounds);
      // this.sitesMap.setMaxBounds(programBounds)

      this.newSiteMarker = null;
      if (canSubmit) {
        this.sitesMap.on("click", (e: L.LeafletMouseEvent) => {
          let coords = L.point(e.latlng.lng, e.latlng.lat);
          if (this.newSiteMarker !== null) {
            this.sitesMap.removeLayer(this.newSiteMarker);
          }
          let z = this.sitesMap.getZoom();

          if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
            // this.hasZoomAlert = true;
            L.DomUtil.addClass(
              this.sitesMap.getContainer(),
              "observation-zoom-statement-warning"
            );
            if (this.zoomAlertTimeout) {
              clearTimeout(this.zoomAlertTimeout);
            }
            this.zoomAlertTimeout = setTimeout(() => {
              L.DomUtil.removeClass(
                this.sitesMap.getContainer(),
                "observation-zoom-statement-warning"
              );
            }, 2000);
            return;
          }
          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration
          // https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (programBounds.contains([e.latlng.lat, e.latlng.lng])) {
            this.newSiteMarker = L.marker(e.latlng, {
              icon: this.options.NEW_OBS_MARKER_ICON()
            }).addTo(this.sitesMap);
          }
          // emit new coordinates
          this.onClick.emit(coords);
        });
      }
      this.programMaxBounds = programBounds;
    }
  }

  canStart(): void {}
}

@Component({
  selector: "popup",
  template: `
     <ng-container>
      <img [src]="(data.photo ? env.AppConfig.API_ENDPOINT + data.photo.url : 'assets/no_photo_light.png')">
      <p>
        <b>{{ data.name }}</b><br>
        <span>Ajoutée par {{ data.obs_txt }}<br>
        le {{ data.timestamp_create.substring(0, 10) | date : longDate }}
        </span><br>
        <a [routerLink]="['/programs', data.id_program, 'sites', data.id_site]" style="cursor:pointer">
          + Voir les détails
        </a>
        </p>
      <div [routerLink]="['/programs', data.id_program, 'sites', data.id_site]" style="cursor:pointer" title="Voir les détails sur cette mare">
          <img class="icon" src="assets/binoculars.png">
      </div>
    </ng-container>
  `
})
export class SiteMarkerPopupComponent {
  @Input() data;
  @Input() env;
}
