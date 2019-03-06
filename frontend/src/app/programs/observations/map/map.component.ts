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

const BASE_LAYERS = MAP_CONFIG["BASEMAP"].reduce((acc, baseLayer: Object) => {
  acc[baseLayer["name"]] = L.tileLayer(baseLayer["layer"], {
    attribution: baseLayer["attribution"],
    subdomains: baseLayer["subdomains"]
  });
  return acc;
}, {});
const DEFAULT_BASE_MAP =
  BASE_LAYERS[
    Object.keys(BASE_LAYERS)[
      (Math.random() * MAP_CONFIG["BASEMAP"].length) >> 0
    ]
  ];

const newObsMarkerIcon = () =>
  L.icon({
    iconUrl: "assets/pointer-blue2.png",
    iconSize: [33, 42],
    iconAnchor: [16, 42]
  });

const obsMarkerIcon = () =>
  L.icon({
    iconUrl: "assets/pointer-green.png",
    iconSize: [33, 42],
    iconAnchor: [16, 42]
  });

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
  clustersLayer: L.FeatureGroup;
  map_init = false;

  constructor() {}

  ngOnInit() {
    this.initMap("obsMap", {});
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
    this.obsMap.zoomControl.setPosition("topright");
    // scale
    L.control
      .scale({ position: "bottomleft", imperial: false })
      .addTo(this.obsMap);
    // Base layers control
    L.control
      .layers(BASE_LAYERS, null, { collapsed: false })
      .addTo(this.obsMap);
    this.map_init = true;
    if (this.geolocate) {
      this.initTracking();
    }
  }

  loadObservations(): void {
    if (this.observations) {
      // if (this.clusterLayer) { this.obsMap.remove this.clustersLayer }
      this.clustersLayer = L.markerClusterGroup({
        iconCreateFunction: clusters => {
          const childCount = clusters.getChildCount();
          let c = " marker-cluster-";
          if (childCount < 10) {
            c += "small";
          } else if (childCount < 100) {
            c += "medium";
          } else {
            c += "large";
          }

          return new L.DivIcon({
            html: "<div><span>" + childCount + "</span></div>",
            className: "marker-cluster" + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      this.clustersLayer.addLayer(
        L.geoJSON(<GeoJsonObject>this.observations, {
          onEachFeature: this.onEachFeature,
          pointToLayer: this.pointToLayer
        })
      );

      this.obsMap.addLayer(this.clustersLayer);
    }
  }

  initTracking(watch = true, enableHighAccuracy = true): void {
    this.obsMap.locate({
      watch: watch,
      enableHighAccuracy: enableHighAccuracy
    });
    this.obsMap.on("locationfound", this.onLocationFound.bind(this));
    this.obsMap.on("locationerror", this.onLocationError.bind(this));
  }

  onEachFeature(feature, layer): void {
    let popupContent =
      '<img src="assets/Azure-Commun-019.JPG"><p><b>' +
      feature.properties.common_name +
      "</b></br><span>Observé par " +
      feature.properties.sci_name +
      "</br>le " +
      feature.properties.date +
      '</span></p><div><img class="icon" src="assets/binoculars.png"></div>';

    if (feature.properties && feature.properties.popupContent) {
      popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent);
  }

  pointToLayer(_feature, latlng): L.Marker {
    return L.marker(latlng, { icon: obsMarkerIcon() });
  }

  onLocationFound(e): void {
    const radius = e.accuracy / 2;
    L.marker(e.latlng, {
      icon: newObsMarkerIcon()
    }).addTo(this.obsMap);
    // geolocation.bindPopup("You are within " + radius + " meters from this point").openPopup()
    const disk = L.circle(e.latlng, radius).addTo(this.obsMap);
    console.debug("Geolocation", e.latlng);
    if (this.programMaxBounds) {
      this.obsMap.fitBounds(disk.getBounds().extend(this.programMaxBounds));
    }
  }

  onLocationError(e) {
    // window.alert(e.message);
    console.warn(e.message);
  }

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
            icon: newObsMarkerIcon()
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
