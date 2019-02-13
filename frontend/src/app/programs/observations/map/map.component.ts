import {
  Component,
  ViewEncapsulation,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from "@angular/core";

import { GeoJsonObject, FeatureCollection } from "geojson";
import * as L from "leaflet";
import "leaflet.markercluster";

// import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

const newObsMarkerIcon = () =>
  L.icon({
    iconUrl: "../../../../assets/pointer-blue2.png",
    iconSize: [33, 42],
    iconAnchor: [16, 42]
  });

const obsMarkerIcon = () =>
  L.icon({
    iconUrl: "../../../../assets/pointer-green.png",
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
  programMaxBounds: L.LatLngBounds;
  coords: string;
  obsMap: L.Map;
  clustersLayer: L.FeatureGroup;
  map_init = false;

  constructor() {}

  ngOnInit() {
    this.initMap();
    if (this.geolocate) {
      this.initTracking();
    }
  }

  ngOnChanges(_changes: SimpleChanges) {
    // migrate to observables on Inputs and on changes
    if (this.obsMap) {
      this.loadProgramArea();
      this.loadObservations();
    }
  }

  initMap() {
    this.obsMap = L.map("obsMap");
    this.obsMap.zoomControl.setPosition("topright");
    L.control
      .scale({ position: "bottomleft", imperial: false })
      .addTo(this.obsMap);
    L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap"
    }).addTo(this.obsMap);
    this.map_init = true;
  }

  loadObservations(): void {
    if (this.observations) {
      // this.obsMap.remove this.clustersLayer
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

  initTracking() {
    this.obsMap.locate({
      watch: true,
      enableHighAccuracy: true
    });
    this.obsMap.on("locationfound", this.onLocationFound.bind(this));
    this.obsMap.on("locationerror", this.onLocationError.bind(this));
  }

  onEachFeature(feature, layer) {
    let popupContent =
      '<img src="../../../assets/Azure-Commun-019.JPG"><p><b>' +
      feature.properties.common_name +
      "</b></br><span>Observé par " +
      feature.properties.sci_name +
      "</br>le " +
      feature.properties.date +
      '</span></p><div><img class="icon" src="../../../../assets/binoculars.png"></div>';

    if (feature.properties && feature.properties.popupContent) {
      popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent);
  }

  pointToLayer(_feature, latlng) {
    return L.marker(latlng, { icon: obsMarkerIcon() });
  }

  onLocationFound(e) {
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
    window.alert(e.message);
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
