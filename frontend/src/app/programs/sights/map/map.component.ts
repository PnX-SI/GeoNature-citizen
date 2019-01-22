import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import * as L from "leaflet";
import { map } from "rxjs/operators";
import { AppConfig } from "../../../../conf/app.config";
// import { ThrowStmt } from "@angular/compiler";

declare let $: any;

@Component({
  selector: "app-sight-map",
  template: `<div id="sightmap"></div>`,
  styleUrls: ["./map.component.css"]
})
export class SightsMapComponent implements OnInit {
  sightsGeoJson: any;
  programAreaGeoJson: any;
  coords: any;
  program_id: any;
  mysightmap: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.program_id = params["id"];
    });
  }

  ngOnInit() {
    this.initMap();
    this.getProgramArea(this.program_id);
    this.getSightsItems(this.program_id);
  }

  getSightsItems(id): void {
    this.restItemsServiceGetSightsItems(id).subscribe(sights => {
      this.sightsGeoJson = sights;

      const geoSights = this.sightsGeoJson;

      const mysightmap = this.mysightmap;

      const geojsonMarkerOptions = {
        radius: 5,
        fillColor: "#1779ba",
        color: "#ccc",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      };

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
        return L.circleMarker(latlng, geojsonMarkerOptions);
      }

      console.log("SIGHTS :", geoSights);
      L.geoJSON(geoSights, {
        onEachFeature: onEachFeature,
        pointToLayer: pointToLayer
      }).addTo(mysightmap);
    });
  }

  // mv to services ?
  getProgramArea(id): void {
    this.restItemsServiceGetProgramArea(id).subscribe(programarea => {
      this.programAreaGeoJson = programarea;
      const mysightmap = this.mysightmap;
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
      }).addTo(mysightmap);
      mysightmap.fitBounds(programArea.getBounds());
    });
  }

  initMap() {
    const mysightmap = L.map("sightmap");

    L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap"
    }).addTo(mysightmap);

    const markerIcon = L.icon({
      iconUrl:
        "../../../../assets/pointer-white.png"
    });

    let myMarker = null;

    const myMarkerTitle =
      '<i class="fa fa-eye"></i> Partagez votre observation';

    mysightmap.on("click", function(e) {
      let coords = JSON.stringify({
        type: "Point",
        coordinates: [e.latlng.lng, e.latlng.lat]
      });
      this.coords = coords;
      // console.log(coords);
      if (myMarker !== null) {
        mysightmap.removeLayer(myMarker);
      }
      myMarker = L.marker(e.latlng, { icon: markerIcon }).addTo(mysightmap);
      $("#feature-title").html(myMarkerTitle);
      $("#feature-coords").html(coords);
      // $("#feature-info").html(myMarkerContent);
      $("#featureModal").modal("show");
    });

    this.mysightmap = mysightmap;
  }

  restItemsServiceGetSightsItems(program_id) {
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
