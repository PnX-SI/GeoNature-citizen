import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  ElementRef
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const obsFormMarkerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png",
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
  @ViewChild("photo") photo: ElementRef;
  obsForm = new FormGroup({
    cd_nom: new FormControl("", Validators.required),
    count: new FormControl("1", Validators.required),
    comment: new FormControl("", Validators.required),
    date: new FormControl("2019-03-05", Validators.required),
    photo: new FormControl("", Validators.required),
    municipality: new FormControl(),
    geometry: new FormControl("", Validators.required),
    id_program: new FormControl("", Validators.required)
  });
  taxonListThreshold = taxonListThreshold;
  surveySpecies: any;
  taxonomyList: any;
  program: any;
  program_id: any;
  formMap: any;
  private today = new Date();
  isDisabled = (date: NgbDate, current: { month: number }) => {
    const date_impl = new Date(date.year, date.month - 1, date.day);
    return date_impl > this.today;
  };

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

        formMap.on("click", (e: LeafletMouseEvent) => {
          let coords = L.point(e.latlng.lng, e.latlng.lat);

          this.obsForm.patchValue({ geometry: coords });
          // TODO: this.obsForm.patchValue({ municipality: municipality });
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

  onFormSubmit(): any {
    console.debug("formValues:", this.obsForm.value);
    this.postObservation().subscribe(
      data => console.debug(data),
      err => console.error(err),
      () => {
        console.log("done");
        // TODO: queue obs in list
        return this.obsForm.value;
      }
    );
  }

  postObservation(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };

    this.obsForm.controls["id_program"].patchValue(this.program_id);

    let obsDate = NgbDate.from(this.obsForm.controls.date.value);
    this.obsForm.controls["date"].patchValue(
      new Date(obsDate.year, obsDate.month, obsDate.day)
        .toISOString()
        .match(/\d{4}-\d{2}-\d{2}/)[0]
    );

    let formData: FormData = new FormData();

    const files: FileList = this.photo.nativeElement.files;
    if (files.length > 0) {
      formData.append("file", files[0], files[0].name);
    }

    formData.append(
      "geometry",
      JSON.stringify(this.obsForm.get("geometry").value)
    );

    for (let item of [
      "cd_nom",
      "count",
      "comment",
      "date",
      // "municipality",
      "id_program"
    ]) {
      formData.append(item, this.obsForm.get(item).value);
    }

    console.debug("formData:", formData);
    return this.http.post<any>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
    // .pipe(tap(data => console.debug(data)));
  }

  // TODO: call GncProgramsService
  restItemsServiceGetTaxonomyList(program_id) {
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + program_id)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
      });
  }

  restItemsServiceGetSurveySpeciesItems(taxlist) {
    return this.http.get(
      `${AppConfig.API_ENDPOINT}/taxonomy/lists/${taxlist}/species`
    );
  }

  getSurveySpeciesItems(taxlist): void {
    this.restItemsServiceGetSurveySpeciesItems(taxlist).subscribe(
      species => (this.surveySpecies = species)
    );
  }
}
