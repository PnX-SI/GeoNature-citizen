import {
  Component,
  AfterViewInit,
  ViewEncapsulation,
  Input
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs/operators";

import { GeoJsonObject, FeatureCollection } from "geojson";
import L from "leaflet";
import "leaflet.markercluster";

import { AppConfig } from "../../../../conf/app.config";
import { Subscription } from "rxjs";

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
export class ObsMapComponent implements AfterViewInit {
  @Input("observations") observations: FeatureCollection;
  obsGeoFeature: any;
  programAreaGeoJson: any;
  program_id: any;
  programMaxBounds: any;
  coords: any;
  obsMap: any;
  geolocate: true;
  routeSubscription: Subscription;
  clustersLayer: L.FeatureGroup;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.routeSubscription = this.route.params.subscribe(params => {
      this.program_id = params["id"];
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.getProgramArea(this.program_id);
    // this.getObservations(this.program_id);
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
  }

  ngOnChanges() {
    if (this.observations) {
      const geoFeatures = this.observations["features"];

      console.debug("Observations :", geoFeatures);

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

      console.debug("GEOLOCATION INITIALIZATION", this.geolocate);
      // if (this.geolocate) {
      this.obsMap.locate({
        // setView: true,
        watch: true,
        enableHighAccuracy: true
      });
      console.debug("GEOLOCATION INITIALIZED");
      this.obsMap.on("locationfound", this.onLocationFound.bind(this));
      // }
    }
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
    console.debug("GEOLOCALIZED");
    const radius = e.accuracy / 2;
    const map = this.obsMap;
    console.debug(this.obsMap);
    const geolocation = L.marker(e.latlng, {
      icon: newObsMarkerIcon()
    }).addTo(map);
    // geolocation.bindPopup("You are within " + radius + " meters from this point").openPopup()
    const disk = L.circle(e.latlng, radius).addTo(map);
    console.debug("GEOLOCATION", e.latlng);
    if (this.programMaxBounds) {
      this.obsMap.fitBounds(disk.getBounds().extend(this.programMaxBounds));
    }
  }

  // mv to services ?
  getProgramArea(id): void {
    this.restItemsServiceGetProgramArea(id).subscribe(programarea => {
      this.programAreaGeoJson = programarea;
      const obsMap = this.obsMap;
      const programArea = L.geoJSON(this.programAreaGeoJson, {
        style: function(_feature) {
          return programAreaStyle;
        }
      }).addTo(obsMap);

      const programMaxBounds = programArea.getBounds();
      obsMap.fitBounds(programMaxBounds);
      // obsMap.setMaxBounds(programMaxBounds)

      let myNewObsMarker = null;
      obsMap.on("click", function(e) {
        let coords = JSON.stringify({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat]
        });

        this.coords = coords;
        console.debug(coords);

        if (myNewObsMarker !== null) {
          obsMap.removeLayer(myNewObsMarker);
        }

        // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
        // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
        if (programMaxBounds.contains([e.latlng.lat, e.latlng.lng])) {
          myNewObsMarker = L.marker(e.latlng, {
            icon: newObsMarkerIcon()
          }).addTo(obsMap);
          $("#feature-title").html(myMarkerTitle);
          $("#feature-coords").html(coords);
          // $("#feature-info").html(myMarkerContent);
          $("#featureModal").modal("show");
        }
      });
      this.programMaxBounds = programMaxBounds;
    });
  }

  initMap() {
    const obsMap = L.map("obsMap");

    obsMap.zoomControl.setPosition("topright");
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(obsMap);
    L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap"
    }).addTo(obsMap);

    this.obsMap = obsMap;
  }

  restItemsServiceGetObsItems(program_id) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${program_id}/observations`)
      .pipe(map(data => data));
  }

  restItemsServiceGetProgramArea(program_id) {
    console.log(
      "PROGRAM_GEO_URL: ",
      `${AppConfig.API_ENDPOINT}/programs/${program_id}`
    );
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${program_id}`)
      .pipe(map(data => data));
  }
}
