import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

import * as L from "leaflet"; // universal ?
// import 'leaflet'
import 'leaflet.markercluster'

import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

// const L = window['L']

const newObsMarkerIcon = () => L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
})

const obsMarkerIcon = () => L.icon({
  iconUrl: "../../../../assets/pointer-green.png",
  iconSize: [33, 42],
  iconAnchor: [16, 42]
})

const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation';

const programAreaStyle = {
  fillColor: 'transparent',
  weight: 2,
  opacity: 0.8,
  color: 'red',
  dashArray: '4'
}

@Component({
  selector: "app-obs-map",
  template: `<div id="obsMap"></div>`,
  styleUrls: ['./map.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ObsMapComponent implements OnInit {
  obsGeoFeature: any;
  programAreaGeoJson: any;
  program_id: any;
  programMaxBounds: any;
  coords: any;
  obsMap: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.program_id = params["id"];
    });
  }

  ngOnInit() {
    this.initMap();
    this.getProgramArea(this.program_id);
    // if not form
    this.getObservations(this.program_id);
  }

  getObservations(id): void {
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
          "</span></p><div><img class=\"icon\" src=\"../../../../assets/binoculars.png\"></div>";

        if (feature.properties && feature.properties.popupContent) {
          popupContent += feature.properties.popupContent;
        }

        layer.bindPopup(popupContent);
      }

      function pointToLayer(_feature, latlng) {
        return L.marker(latlng, { icon: obsMarkerIcon() })
      }

      console.debug("Observations :", geoFeatures);

      var cluster = new L.MarkerClusterGroup({
      	iconCreateFunction: function(cluster) {
          const childCount = cluster.getChildCount()
          let c = ' marker-cluster-'
          if (childCount < 10) {
            c += 'small'
          } else if (childCount < 100) {
            c += 'medium'
          } else {
            c += 'large'
          }

          return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) })
          }
        }
      )

      cluster.addLayer(
        L.geoJSON(geoFeatures, {
          onEachFeature: onEachFeature,
          pointToLayer: pointToLayer
        })
      )

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
          return programAreaStyle
        }
      }).addTo(obsMap);

      const programMaxBounds = programArea.getBounds()
      obsMap.fitBounds(programMaxBounds)
      // QUESTION: enforce program area maxBounds (optional ?)
      // obsMap.setMaxBounds(programMaxBounds)

      let myMarker = null;
      obsMap.on("click", function(e) {
        let coords = JSON.stringify({
          type: "Point", coordinates: [e.latlng.lng, e.latlng.lat]
        });
        
        this.coords = coords;
        console.debug(coords)

        if (myMarker !== null) {
          obsMap.removeLayer(myMarker);
        }

        // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
        // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
        if (L.latLngBounds(programMaxBounds).contains([e.latlng.lat, e.latlng.lng])) {
          myMarker = L.marker(e.latlng, { icon: newObsMarkerIcon() }).addTo(obsMap);
          $("#feature-title").html(myMarkerTitle);
          $("#feature-coords").html(coords);
          // $("#feature-info").html(myMarkerContent);
          $("#featureModal").modal("show");
        }
      });

    });
  }

  initMap() {
    const obsMap = L.map("obsMap")

    obsMap.zoomControl.setPosition('topright')
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(obsMap);
    L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OpenStreetMap" })
        .addTo(obsMap);

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
