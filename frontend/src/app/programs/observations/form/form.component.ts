import { Component, ViewEncapsulation, AfterViewInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { map, tap } from "rxjs/operators";

import { Position, Point } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";
import { Observable } from "rxjs";

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const obsFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
});
export const myMarkerTitle =
  '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
  selector: "app-obs-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  obsForm = new FormGroup({
    cd_nom: new FormControl("", Validators.required),
    count: new FormControl("", Validators.required),
    comment: new FormControl("", Validators.required),
    date: new FormControl("", Validators.required),
    photo: new FormControl("", Validators.required),
    municipality: new FormControl("", Validators.required),
    geometry: new FormControl("", Validators.required),
    id_program: new FormControl("", Validators.required)
  });
  taxonListThreshold = taxonListThreshold;
  surveySpecies: any;
  taxonomyList: any;
  program: any;
  program_id: any;
  formMap: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
        this.getSurveySpeciesItems(this.taxonomyList);

        const formMap = L.map("formMap");

        L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap"
        }).addTo(formMap);

        const programArea = L.geoJSON(this.program, {
          style: function(_feature) {
            return {
              fillColor: "transparent",
              weight: 2,
              opacity: 0.8,
              color: "red",
              dashArray: "4"
            };
          }
        }).addTo(formMap);

        const maxBounds: L.LatLngBounds = programArea.getBounds();
        formMap.fitBounds(maxBounds);
        formMap.setMaxBounds(maxBounds);

        let myMarker = null;

        formMap.on("click", <LeafletMouseEvent>(e) => {
          let coords = <Point>{
            type: "Point",
            coordinates: <Position>[e.latlng.lng, e.latlng.lat]
          };
          this.obsForm.patchValue({ geometry: coords });
          // this.obsForm.patchValue({ municipality: municipality });
          this.obsForm.patchValue({ municipality: null });
          console.debug(coords);

          if (myMarker !== null) {
            formMap.removeLayer(myMarker);
          }

          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
            myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(
              formMap
            );
            $("#feature-title").html(myMarkerTitle);
            $("#feature-coords").html(coords);
            // $("#feature-info").html(myMarkerContent);
            $("#featureModal").modal("show");
          }
        });
      });
  }

  onFormSubmit(): void {
    // FIXME: ExpressionChangedAfterItHasBeenCheckedError
    this.obsForm.patchValue({ id_program: this.program_id });
    // this.obsForm.patchValue({ specie: this.what.nom.nom_francais})

    let obsDate = this.obsForm.controls.date.value;
    this.obsForm.patchValue({
      date: new Date(obsDate.year, obsDate.month, obsDate.day)
        .toISOString()
        .match(/\d{4}-\d{2}-\d{2}/)[0]
    });

    console.debug("formValues:", this.obsForm.value);
    this.postObservation().subscribe(data => {
      console.debug(data);
    });
  }

  postObservation(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json"
        // Authorization: "my-auth-token"
      })
    };
    return this.http
      .post<any>(`${this.URL}/observations`, this.obsForm.value, httpOptions)
      .pipe(
        map(response => response.json() || []),
        tap(data => console.debug(data))
      );
  }

  restItemsServiceGetTaxonomyList(program_id) {
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + program_id)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
      });
  }

  restItemsServiceGetSurveySpeciesItems(taxlist) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/${taxlist}/species`)
      .pipe(map(data => data));
  }

  getSurveySpeciesItems(taxlist): void {
    this.restItemsServiceGetSurveySpeciesItems(taxlist).subscribe(
      species => (this.surveySpecies = species)
    );
  }
}
