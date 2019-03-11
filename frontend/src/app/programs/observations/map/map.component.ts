import {
  Component,
  ViewEncapsulation,
  OnInit,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  EventEmitter
} from "@angular/core";

import { GeoJsonObject, FeatureCollection } from "geojson";
import * as L from "leaflet";
import "leaflet.markercluster";
import "leaflet.locatecontrol";

// import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";

const conf = {
  ELEMENT: "obsMap",
  GEOLOCATION_HIGH_ACCURACY: false,
  BASE_LAYERS: MAP_CONFIG["BASEMAP"].reduce((acc, baseLayer: Object) => {
    acc[baseLayer["name"]] = L.tileLayer(baseLayer["layer"], {
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
    // return conf.BASE_LAYERS[
    //   Object.keys(conf.BASE_LAYERS)[
    //     (Math.random() * MAP_CONFIG["BASEMAP"].length) >> 0
    //   ]
    // ];
    return conf.BASE_LAYERS["OpenStreetMapFRHot"];
  },
  ZOOM_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_POSITION: "topright",
  BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
  GEOLOCATION_CONTROL_POSITION: "topright",
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
  ON_EACH_FEATURE: (feature, layer) => {
    let popupContent = `
      <img src="assets/Azure-Commun-019.JPG">
      <p>
        <b>${feature.properties.common_name}</b>
        </br>
        <span i18n>
          Observé par ${feature.properties.sci_name}
          </br>
          le ${feature.properties.date}
        </span>
      </p>
      <div>
        <img class="icon" src="assets/binoculars.png">
      </div>`;

    if (feature.properties && feature.properties.popupContent) {
      popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent);
  },
  POINT_TO_LAYER: (_feature, latlng): L.Marker =>
    L.marker(latlng, { icon: conf.OBS_MARKER_ICON() }),
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
    <div id="obsMap"></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsMapComponent implements OnInit, OnChanges {
  /*
   PLAN: migrate layer logic to parent component/service, rm inputs
    instance config (element_id, tilehost, attribution, ... std leaflet options)
      @outputs:
        onClick
        onLayerAdded
        onLayerRemoved
  */

  @Input("observations") observations: FeatureCollection;
  @Input("program") program: FeatureCollection;

  @Output() onClick: EventEmitter<string> = new EventEmitter();
  options: any;
  obsMap: L.Map;

  programMaxBounds: L.LatLngBounds;
  observationsLayer: L.FeatureGroup;
  newObsMarker: L.Marker<any>;

  ngOnInit() {
    this.initMap(conf);
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.obsMap) {
      this.loadProgramArea();
      this.loadObservations();
    }
  }

  initMap(options: any, LeafletOptions: L.MapOptions = {}): void {
    this.options = options;
    this.obsMap = L.map(this.options.ELEMENT, {
      layers: [this.options.DEFAULT_BASE_MAP()],
      ...LeafletOptions
    });

    // zoom
    this.obsMap.zoomControl.setPosition(this.options.ZOOM_CONTROL_POSITION);

    // scale
    L.control
      .scale({ position: this.options.SCALE_CONTROL_POSITION })
      .addTo(this.obsMap);

    // Base layers
    L.control
      .layers(this.options.BASE_LAYERS, null, {
        collapsed: this.options.BASE_LAYER_CONTROL_INIT_COLLAPSED,
        position: this.options.BASE_LAYER_CONTROL_POSITION
      })
      .addTo(this.obsMap);

    // geolocation
    L.control
      .locate({
        position: this.options.GEOLOCATION_CONTROL_POSITION,
        getLocationBounds: locationEvent =>
          locationEvent.bounds.extend(this.programMaxBounds),
        locateOptions: {
          enableHighAccuracy: this.options.GEOLOCATION_HIGH_ACCURACY
        }
      })
      .addTo(this.obsMap);
  }

  loadObservations(): void {
    if (this.observations) {
      if (this.observationsLayer) {
        this.obsMap.removeLayer(this.observationsLayer);
      }
      this.observationsLayer = this.options.OBSERVATION_LAYER();

      this.observationsLayer.addLayer(
        L.geoJSON(<GeoJsonObject>this.observations, {
          onEachFeature: this.options.ON_EACH_FEATURE,
          pointToLayer: this.options.POINT_TO_LAYER
        })
      );

      this.obsMap.addLayer(this.observationsLayer);
    }
  }

  loadProgramArea(canSubmit = true): void {
    if (this.program) {
      const programArea = L.geoJSON(this.program, {
        style: _feature => this.options.PROGRAM_AREA_STYLE(_feature)
      }).addTo(this.obsMap);
      const programBounds = programArea.getBounds();
      this.obsMap.fitBounds(programBounds);
      // this.obsMap.setMaxBounds(programBounds)

      this.newObsMarker = null;
      if (canSubmit) {
        this.obsMap.on("click", (e: L.LeafletMouseEvent) => {
          let coords = L.point(e.latlng.lng, e.latlng.lat);
          if (this.newObsMarker !== null) {
            this.obsMap.removeLayer(this.newObsMarker);
          }

          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (programBounds.contains([e.latlng.lat, e.latlng.lng])) {
            this.newObsMarker = L.marker(e.latlng, {
              icon: this.options.NEW_OBS_MARKER_ICON()
            }).addTo(this.obsMap);
          }
          console.debug(coords);
          // emit new coordinates
          this.onClick.emit(JSON.stringify(coords));
        });
      }
      this.programMaxBounds = programBounds;
    }
  }
}
