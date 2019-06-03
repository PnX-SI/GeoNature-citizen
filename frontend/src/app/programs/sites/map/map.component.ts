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
import {formatDate} from "@angular/common";
import {AppConfig} from "../../../../conf/app.config";

// import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

// TODO: coupling of marker theming and map tile config
/*
 PLAN:
    migrate layer logic to parent component/service, rm inputs
    instance config (element_id, {tilehost, attribution})
      @outputs:
        onLayerAdded
        onLayerRemoved
        onClick

      fitBounds(layer)
      setMaxBounds(layer)
      panTo(layer)
      geolocate(boolean)
*/
export const DEFAULT_TILES = {
  url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "OpenStreetMap"
};

export const NO_IMG = '../../assets/no_photo_light.png';
// export const DEFAULT_TILES = {
//   // url: "http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg",
//   url: "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg",
//   // url: "http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg",
//   attribution: "maps.stamen.com"
// };

// export const DEFAULT_TILES = {
//   url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
//   // url: "https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}",
//   // url: "https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}",
//   attribution: "maps.google.com"
// };

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

const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre site';

const programAreaStyle = {
  fillColor: "transparent",
  weight: 2,
  opacity: 0.8,
  color: "red",
  dashArray: "4"
};

@Component({
  selector: "app-sites-map",
  template: `
    <div id="sitesMap"></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SitesMapComponent implements OnInit, OnChanges {
  @Input("sites") sites: FeatureCollection;
  @Input("program") program: FeatureCollection;
  @Input("geolocate") geolocate = true;
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  programMaxBounds: L.LatLngBounds;
  coords: string;
  sitesMap: L.Map;
  clustersLayer: L.FeatureGroup;
  map_init = false;

  constructor() {}

  ngOnInit() {
    this.initMap("sitesMap", {}, DEFAULT_TILES);
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.sitesMap) {
      this.loadProgramArea();
      this.loadSites();
    }
  }

  initMap(
    element: string | HTMLElement = "sitesMap",
    options: L.MapOptions = {},
    tiles: Object = DEFAULT_TILES
  ): void {
    this.sitesMap = L.map(element, options);
    L.control
      .scale({ position: "bottomleft", imperial: false })
      .addTo(this.sitesMap);
    L.tileLayer(tiles["url"], {
      attribution: tiles["attribution"]
    }).addTo(this.sitesMap);
    this.map_init = true;
    if (this.geolocate) {
      this.initTracking();
    }
  }

  loadSites(): void {
    if (this.sites) {
      // if (this.clusterLayer) { this.sitesMap.remove this.clustersLayer }
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
        L.geoJSON(<GeoJsonObject>this.sites, {
          onEachFeature: this.onEachFeature,
          pointToLayer: this.pointToLayer
        })
      );

      this.sitesMap.addLayer(this.clustersLayer);
    }
  }

  initTracking(watch = true, enableHighAccuracy = true): void {
    this.sitesMap.locate({
      watch: watch,
      enableHighAccuracy: enableHighAccuracy
    });
    this.sitesMap.on("locationfound", this.onLocationFound.bind(this));
    this.sitesMap.on("locationerror", this.onLocationError.bind(this));
  }

  onEachFeature(feature, layer): void {
    let popupContent =
      '<img src="' +
      (feature.properties.photo ? AppConfig.API_ENDPOINT + feature.properties.photo.url : NO_IMG) +
      '"><p><b>' +
      feature.properties.name +
      "</b></br><span>Ajoutée par " +
      feature.properties.obs_txt +
      "</br>le " +
      formatDate(feature.properties.timestamp_create, "longDate", "fr-FR") +
      '</span><br>' +
      '<a href="/programs/' + feature.properties.id_program + '/sites/' +
      feature.properties.id_site + '">details</a>' +
      '</p>' +
      '<div><img class="icon" src="../../../../assets/binoculars.png"></div>';

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
    }).addTo(this.sitesMap);
    // geolocation.bindPopup("You are within " + radius + " meters from this point").openPopup()
    const disk = L.circle(e.latlng, radius).addTo(this.sitesMap);
    console.debug("Geolocation", e.latlng);
    if (this.programMaxBounds) {
      this.sitesMap.fitBounds(disk.getBounds().extend(this.programMaxBounds));
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
      }).addTo(this.sitesMap);
      const programBounds = programArea.getBounds();
      this.sitesMap.fitBounds(programBounds);
      // this.sitesMap.setMaxBounds(programBounds)

      let myNewObsMarker = null;
      this.sitesMap.on("click", (e: L.LeafletMouseEvent) => {
        this.onClick.emit(L.point(e.latlng.lng, e.latlng.lat));
        let coords = JSON.stringify({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat]
        });

        if (myNewObsMarker !== null) {
          this.sitesMap.removeLayer(myNewObsMarker);
        }

        // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
        // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
        if (programBounds.contains([e.latlng.lat, e.latlng.lng])) {
          this.coords = coords;
          console.debug(coords);
          // emit new coordinates
          myNewObsMarker = L.marker(e.latlng, {
            icon: newObsMarkerIcon()
          }).addTo(this.sitesMap);
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
