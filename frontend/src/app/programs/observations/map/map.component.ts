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

import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";

declare let $: any;

/*
 PLAN:
    migrate layer logic to parent component/service, rm inputs
    instance config (element_id, tilehost, attribution, ... std leaflet options)
      @outputs:
        onLayerAdded
        onLayerRemoved
        onClick

      fitBounds(layer)
      setMaxBounds(layer)
      panTo(layer)
      geolocate(boolean)
*/
const GEOLOCATION_HIGH_ACCURACY = false;
const BASE_LAYERS = MAP_CONFIG["BASEMAP"].reduce((acc, baseLayer: Object) => {
  acc[baseLayer["name"]] = L.tileLayer(baseLayer["layer"], {
    attribution: baseLayer["attribution"],
    subdomains: baseLayer["subdomains"],
    detectRetina: baseLayer["detectRetina"]
  });
  return acc;
}, {});
// Get a random base map to test
const DEFAULT_BASE_MAP =
  BASE_LAYERS[
    Object.keys(BASE_LAYERS)[
      (Math.random() * MAP_CONFIG["BASEMAP"].length) >> 0
    ]
  ];

const ZOOM_CONTROL_POSITION = "topright";
const BASE_LAYER_CONTROL_POSITION = "topright";
const BASE_LAYER_CONTROL_INIT_COLLAPSED = true;
const GEOLOCATION_CONTROL_POSITION = "topright";
const SCALE_CONTROL_POSITION = "bottomleft";

const NEW_OBS_MARKER_ICON = () =>
  L.icon({
    iconUrl: "assets/pointer-blue2.png",
    iconSize: [33, 42],
    iconAnchor: [16, 42]
  });

const OBS_MARKER_ICON = () =>
  L.icon({
    iconUrl: "assets/pointer-green.png",
    iconSize: [33, 42],
    iconAnchor: [16, 42]
  });

const OBSERVATION_LAYER = () =>
  L.markerClusterGroup({
    iconCreateFunction: clusters => {
      const childCount = clusters.getChildCount();
      return CLUSTER_MARKER_ICON(childCount);
    }
  });

const CLUSTER_MARKER_ICON = (childCount: number) => {
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
};

const ON_EACH_FEATURE = (feature, layer) => {
  let popupContent = `
    <img src="assets/Azure-Commun-019.JPG">
    <p>
      <b>${feature.properties.common_name}</b>
      </br>
      <span>
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
};

const POINT_TO_LAYER = (_feature, latlng): L.Marker =>
  L.marker(latlng, { icon: OBS_MARKER_ICON() });

const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation';

const programAreaStyle = {
  fillColor: "transparent",
  weight: 2,
  opacity: 0.8,
  color: "red",
  dashArray: "4"
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
  @Input("observations") observations: FeatureCollection;
  @Input("program") program: FeatureCollection;
  @Input("geolocate") geolocate = true;

  @Output() onClick: EventEmitter<any> = new EventEmitter();
  programMaxBounds: L.LatLngBounds;
  coords: string;
  obsMap: L.Map;
  observationsLayer: L.FeatureGroup;
  map_init = false;

  constructor() {}

  ngOnInit() {
    this.initMap("obsMap");
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.obsMap) {
      this.loadProgramArea();
      this.loadObservations();
    }
  }

  initMap(
    element: string | HTMLElement,
    LeafletOptions: L.MapOptions = {}
  ): void {
    this.obsMap = L.map(element, {
      layers: [DEFAULT_BASE_MAP],
      ...LeafletOptions
    });

    // zoom
    this.obsMap.zoomControl.setPosition(ZOOM_CONTROL_POSITION);
    // scale
    L.control.scale({ position: SCALE_CONTROL_POSITION }).addTo(this.obsMap);
    // Base layers control
    L.control
      .layers(BASE_LAYERS, null, {
        collapsed: BASE_LAYER_CONTROL_INIT_COLLAPSED
      })
      .addTo(this.obsMap);
    // geolocation control
    L.control
      .locate({
        locateOptions: {
          enableHighAccuracy: GEOLOCATION_HIGH_ACCURACY
        },
        position: GEOLOCATION_CONTROL_POSITION
        // FIXME: recover program/location fitBounds behavior
        // getLocationBounds: function(locationEvent) {
        //   return this.programMaxBounds.extend(locationEvent.bounds);
        // }
      })
      .addTo(this.obsMap);
    // this.obsMap.on("locationfound", this.onLocationFound.bind(this));
  }

  loadObservations(): void {
    if (this.observations) {
      if (this.observationsLayer) {
        this.obsMap.removeLayer(this.observationsLayer);
      }
      this.observationsLayer = OBSERVATION_LAYER();

      this.observationsLayer.addLayer(
        L.geoJSON(<GeoJsonObject>this.observations, {
          onEachFeature: ON_EACH_FEATURE,
          pointToLayer: POINT_TO_LAYER
        })
      );

      this.obsMap.addLayer(this.observationsLayer);
    }
  }

  // onLocationFound(e): void {
  //   const radius = e.accuracy / 2;
  //   // L.marker(e.latlng, {
  //   //   icon: NEW_OBS_MARKER_ICON()
  //   // }).addTo(this.obsMap);
  //   // geolocation.bindPopup("You are within " + radius + " meters from this point").openPopup()
  //   const disk = L.circle(e.latlng, radius).addTo(this.obsMap);
  //   console.debug("Geolocation", e.latlng);
  //   if (this.programMaxBounds) {
  //     this.obsMap.fitBounds(disk.getBounds().extend(this.programMaxBounds));
  //   }
  // }

  loadProgramArea(): void {
    if (this.program) {
      const programArea = L.geoJSON(this.program, {
        style: function(_feature) {
          return programAreaStyle;
        }
      }).addTo(this.obsMap);
      const programBounds = programArea.getBounds();
      this.obsMap.fitBounds(programBounds);
      // this.obsMap.setMaxBounds(programBounds)

      let myNewObsMarker = null;
      this.obsMap.on("click", (e: L.LeafletMouseEvent) => {
        this.onClick.emit();

        let coords = JSON.stringify({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat]
        });

        if (myNewObsMarker !== null) {
          this.obsMap.removeLayer(myNewObsMarker);
        }

        // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
        // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
        if (programBounds.contains([e.latlng.lat, e.latlng.lng])) {
          this.coords = coords;
          console.debug(coords);
          // emit new coordinates
          myNewObsMarker = L.marker(e.latlng, {
            icon: NEW_OBS_MARKER_ICON()
          }).addTo(this.obsMap);
          $("#feature-title").html(myMarkerTitle);
          $("#feature-coords").html(coords);
          // $("#feature-info").html(myMarkerContent);
          $("#featureModal").modal("show");
        }
      });
      this.programMaxBounds = programBounds;
    }
  }
}
