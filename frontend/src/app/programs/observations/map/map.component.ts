import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

// import * as L from "leaflet"; // universal ?
import 'leaflet'
import 'leaflet.markercluster'

import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

const L = window['L']

const newObsMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
})

const obsMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-green.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
})

const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation';


@Component({
  selector: "app-obs-map",
  template: `<div id="obsMap"></div>`,
  styleUrls: ['./map.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ObsMapComponent implements OnInit {
  obsGeoFeature: any;
  programAreaGeoJson: any;
  coords: any;
  program_id: any;
  obsMap: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.program_id = params["id"];
    });
  }

  ngOnInit() {
    this.initMap();
    this.getProgramArea(this.program_id);
    this.getObservation(this.program_id);
  }

  getObservation(id): void {
    this.restItemsServiceGetObsItems(id).subscribe(obs => {
      const geoFeatures = obs
      const obsMap = this.obsMap;

      function onEachFeature(feature, layer) {
        let popupContent =
          "<img src=\"../../../assets/Azure-Commun-019.JPG\"><p><b>" +
          feature.properties.common_name +
          "</b></br><span>Observé par " +
          feature.properties.sci_name +
          "</br>le " +
          feature.properties.date +
          "</span></p><div><i class=\"fa fa-binoculars\"></i></div>";
        if (feature.properties && feature.properties.popupContent) {
          popupContent += feature.properties.popupContent;
        }
        layer.bindPopup(popupContent);
      }

      function pointToLayer(_feature, latlng) {
        return L.marker(latlng, { icon: obsMarkerIcon })
      }

      console.debug("Observations :", geoFeatures);

      var cluster = new L.MarkerClusterGroup({singleMarkerMode: true})
      cluster.addLayer(
        L.geoJSON(geoFeatures, {
          onEachFeature: onEachFeature,
          pointToLayer: pointToLayer
        }))
      obsMap.addLayer(cluster)
    })
  }

  // mv to services ?
  getProgramArea(id): void {
    this.restItemsServiceGetProgramArea(id).subscribe(programarea => {
      this.programAreaGeoJson = programarea;
      const obsMap = this.obsMap;
      const programArea = L.geoJSON(this.programAreaGeoJson, {
        style: function(_feature) {
          return {
            fillColor: "transparent",
            weight: 2,
            opacity: 0.8,
            color: "red",
            dashArray: "4"
          };
        }
      }).addTo(obsMap);
      obsMap.fitBounds(programArea.getBounds());
    });
  }

  initMap() {
    const obsMap = L.map("obsMap");
    let myMarker = null;

    L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OpenStreetMap" })
        .addTo(obsMap);


    obsMap.on("click", function(e) {
      let coords = JSON.stringify({
        type: "Point", coordinates: [e.latlng.lng, e.latlng.lat]
      });
      this.coords = coords;
      // console.log(coords);
      if (myMarker !== null) {
        obsMap.removeLayer(myMarker);
      }
      myMarker = L.marker(e.latlng, { icon: newObsMarkerIcon }).addTo(obsMap);
      $("#feature-title").html(myMarkerTitle);
      $("#feature-coords").html(coords);
      // $("#feature-info").html(myMarkerContent);
      $("#featureModal").modal("show");
    });

    this.obsMap = obsMap;
  }

  restItemsServiceGetObsItems(program_id=1) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${program_id}/observations`)
      .pipe(map(data => data));
  }

  restItemsServiceGetProgramArea(program_id=1) {
    console.log(
      "PROGRAM_GEO_URL: ",
      `${AppConfig.API_ENDPOINT}/programs/${program_id}`
    );
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${program_id}`)
      .pipe(map(data => data));
  }
}
