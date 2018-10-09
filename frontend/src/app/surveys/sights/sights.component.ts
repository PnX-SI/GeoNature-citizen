import { Component, OnInit } from "@angular/core";
import { RestService } from "../../rest.service";
import { ActivatedRoute, Router } from "@angular/router";
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from "@angular/common/http";
import * as L from "leaflet";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { map } from "rxjs/operators";

declare let $: any;

@Component({
  selector: "app-sights",
  templateUrl: "./sights.component.html",
  styleUrls: ["./sights.component.css"]
})
export class SightsComponent implements OnInit {
  title = "Observations";
  survey_id: any;
  sightsGeoJson: any;
  sightsFeatures: any;
  surveySpecies: any;
  ApiUrl = "http://0.0.0.0:5001/api/";



  constructor(
    // private rest: RestService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params["id"];
    });
  }

  modal(content) {
    this.modalService.open(content, {});
  }

  ngOnInit() {
    this.getSightsItems();
    console.log("PARAMS", this.survey_id);
    this.getSurveySpeciesItems();
  }

  getSurveySpeciesItems(): void {
    this.restItemsServiceGetSurveySpeciesItems().subscribe(species =>
      {
        this.surveySpecies = species;
      })
  }

  getSightsItems(): void {
    this.restItemsServiceGetSightsItems().subscribe(sights => {
      this.sightsFeatures = sights["features"];
      this.sightsGeoJson = sights;

      const mysightmap = L.map("sightmap").setView([45, 5], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap"
      }).addTo(mysightmap);

      const myIcon = L.icon({
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png"
      });
      var myMarker = null;

      var myMarkerTitle =
        '<i class="fa fa-eye"></i> Partagez votre observation';

      mysightmap.on("click", function<LeafletMouseEvent>(e) {
        //var Coords = "Lat, Lon : " + e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3);
        var Coords = JSON.stringify({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat]
        });
        if (myMarker !== null) {
          mysightmap.removeLayer(myMarker);
        }
        myMarker = L.marker(e.latlng, { icon: myIcon }).addTo(mysightmap);
        $("#feature-title").html(myMarkerTitle);
        $("#feature-coords").html(Coords);
        // $("#feature-info").html(myMarkerContent);
        $("#featureModal").modal("show");
      });

      const geoSights = JSON.stringify(sights);
      console.table("SIGHTS :", geoSights);
      L.geoJSON(geoSights).addTo(mysightmap);
    });
  }

  restItemsServiceGetSightsItems() {
    return this.http.get(this.ApiUrl+'sights').pipe(map(data => data));
  }

  restItemsServiceGetSurveySpeciesItems() {
    return this.http.get(this.ApiUrl+'taxonomy/lists/'+this.survey_id+'/species').pipe(map(data => data));
  }
}
