import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import {
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn
} from "@angular/forms";
import { Observable } from "rxjs";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { FeatureCollection } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";
import {
  PostObservationResponse,
  ObservationFeature,
  TaxonomyList
} from "../observation.model";
import { GncProgramsService } from "src/app/api/gnc-programs.service";

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const obsFormMarkerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png",
  iconAnchor: [16, 42]
});
export const myMarkerTitle =
  '<i class="fa fa-eye"></i> Partagez votre observation';

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    const date_impl = new Date(selected.year, selected.month - 1, selected.day);
    return date_impl > today ? { "Parsed a date in the future": true } : null;
  };
}

@Component({
  selector: "app-obs-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  @Input("coords") coords: L.Point;
  @Output("newObservation") newObservation: EventEmitter<
    ObservationFeature
  > = new EventEmitter();
  @ViewChild("photo") photo: ElementRef;
  today = new Date();
  program_id: any;
  obsForm = new FormGroup({
    cd_nom: new FormControl("", Validators.required),
    count: new FormControl("1", Validators.required),
    comment: new FormControl(""),
    date: new FormControl(
      {
        year: this.today.getFullYear(),
        month: this.today.getMonth() + 1,
        day: this.today.getDate()
      },
      [Validators.required, ngbDateMaxIsToday()]
    ),
    photo: new FormControl(""),
    municipality: new FormControl(),
    geometry: new FormControl(
      this.coords ? this.coords : "",
      Validators.required
    ),
    id_program: new FormControl(this.program_id)
  });
  taxonListThreshold = taxonListThreshold;
  surveySpecies: TaxonomyList;
  taxonomyListID: number;
  program: FeatureCollection;
  formMap: L.Map;
  isDisabled = (date: NgbDate, current: { month: number }) => {
    const date_impl = new Date(date.year, date.month - 1, date.day);
    return date_impl > this.today;
  };

  constructor(
    private http: HttpClient,
    private programService: GncProgramsService,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit() {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe((result: FeatureCollection) => {
        this.program = result;
        this.taxonomyListID = this.program.features[0].properties.taxonomy_list;
        this.programService
          .getProgramTaxonomyList(this.program_id)
          .subscribe(species => (this.surveySpecies = species));

        const formMap = L.map("formMap");
        this.formMap = formMap;

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

        // Set initial observation marker from main map if already spotted
        let myMarker = null;
        console.debug("supplied marker coords", this.coords);
        if (this.coords) {
          this.obsForm.patchValue({ geometry: this.coords });

          // wtf coord
          myMarker = L.marker([this.coords.y, this.coords.x], {
            icon: obsFormMarkerIcon
          }).addTo(formMap);

          console.debug("coords", this.coords);
          console.debug("marker", myMarker);
        }

        // Update marker on click event
        formMap.on("click", (e: LeafletMouseEvent) => {
          this.coords = L.point(e.latlng.lng, e.latlng.lat);

          this.obsForm.patchValue({ geometry: this.coords });
          // TODO: this.obsForm.patchValue({ municipality: municipality });
          console.debug(this.coords);

          if (myMarker) {
            formMap.removeLayer(myMarker);
          }

          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
            myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(
              formMap
            );
          }
        });
      });
  }

  onFormSubmit(): void {
    let obs: ObservationFeature;
    this.postObservation().subscribe(
      (data: PostObservationResponse) => {
        obs = data.features[0];
      },
      err => alert(err),
      () => {
        this.newObservation.emit(obs);
      }
    );
  }

  postObservation(): Observable<PostObservationResponse> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };

    this.obsForm.controls["id_program"].patchValue(this.program_id);

    let obsDate = NgbDate.from(this.obsForm.controls.date.value);
    this.obsForm.controls["date"].patchValue(
      new Date(obsDate.year, obsDate.month - 1, obsDate.day)
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

    return this.http.post<PostObservationResponse>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
  }
}
