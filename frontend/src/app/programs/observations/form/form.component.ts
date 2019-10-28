import { MAP_CONFIG } from "./../../../../conf/map.config";
import * as L from "leaflet";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  Output,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import { AppConfig } from "../../../../conf/app.config";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  share,
  tap
} from "rxjs/operators";
import { FeatureCollection } from "geojson";
import { GncProgramsService } from "../../../api/gnc-programs.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LeafletMouseEvent } from "leaflet";
import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { Observable } from "rxjs";
import {
  ObservationFeature,
  PostObservationResponse,
  TaxonomyList,
  TaxonomyListItem
} from "../observation.model";
import "leaflet-gesture-handling";
import "leaflet-fullscreen/dist/Leaflet.fullscreen";
import { ToastrService } from "ngx-toastr";

declare let $: any;

const map_conf = {
  GEOLOCATION_CONTROL_POSITION: "topright",
  GEOLOCATION_HIGH_ACCURACY: false,
  PROGRAM_AREA_STYLE: {
    fillColor: "transparent",
    weight: 2,
    opacity: 0.8,
    color: "red",
    dashArray: "4"
  }
};
const taxonSelectInputThreshold = AppConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold =
  AppConfig.taxonAutocompleteInputThreshold;
const taxonAutocompleteFields = AppConfig.taxonAutocompleteFields;
const taxonAutocompleteMaxResults = 10;

// TODO: migrate to conf
export const obsFormMarkerIcon = L.icon({
  iconUrl: MAP_CONFIG["NEW_OBS_POINTER"],
  iconSize: [33, 42],
  iconAnchor: [16, 42]
});

export function ngbDateMaxIsToday(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const today = new Date();
    const selected = NgbDate.from(control.value);
    if (!selected) return { "Null date": true };
    const date_impl = new Date(selected.year, selected.month - 1, selected.day);
    return date_impl > today ? { "Parsed a date in the future": true } : null;
  };
}

export function geometryValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const validGeometry = /Point\(\d{1,3}(|\.\d{1,7}),(|\s)\d{1,3}(|\.\d{1,7})\)$/.test(
      control.value
    );
    return validGeometry ? null : { geometry: { value: control.value } };
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
  @ViewChild("photo", { static: true }) photo: ElementRef;
  today = new Date();
  program_id: any;
  obsForm = new FormGroup(
    {
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
      geometry: new FormControl(this.coords ? this.coords : "", [
        Validators.required,
        geometryValidator()
      ]),
      id_program: new FormControl(this.program_id),
      email: new FormControl({value:'',disabled:true}),
      agreeContactRGPD: new FormControl(""),
    }
    //{ updateOn: "submit" }
  );
  taxonSelectInputThreshold = taxonSelectInputThreshold;
  taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
  autocomplete = "isOff";
  MAP_CONFIG = MAP_CONFIG;
  formMap: L.Map;
  program: FeatureCollection;
  taxonomyListID: number;
  taxa: TaxonomyList;
  surveySpecies$: Observable<TaxonomyList>;
  species: Object[] = [];
  taxaCount: number;
  selectedTaxon: any;
  hasZoomAlert: boolean;
  zoomAlertTimeout: any;
  AppConfig = AppConfig;

  disabledDates = (date: NgbDate, current: { month: number }) => {
    const date_impl = new Date(date.year, date.month - 1, date.day);
    return date_impl > this.today;
  };

  inputAutoCompleteSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term =>
        term === "" // term.length < n
          ? []
          : this.species
              .filter(
                v => new RegExp(term, "gi").test(v["name"])
                // v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, taxonAutocompleteMaxResults)
      )
    );

  inputAutoCompleteFormatter = (x: { name: string }) => x.name;

  inputAutoCompleteSetup = () => {
    for (let taxon in this.taxa) {
      for (let field of taxonAutocompleteFields) {
        if (this.taxa[taxon]["taxref"][field]) {
          this.species.push({
            name:
              field === "cd_nom"
                ? `${this.taxa[taxon]["taxref"]["cd_nom"]} - ${
                    this.taxa[taxon]["taxref"]["nom_complet"]
                  }`
                : this.taxa[taxon]["taxref"][field],
            cd_nom: this.taxa[taxon]["taxref"]["cd_nom"],
            icon:
              this.taxa[taxon]["medias"].length >= 1
                ? // ? this.taxa[taxon]["medias"][0]["url"]
                  AppConfig.API_TAXHUB +
                  "/tmedias/thumbnail/" +
                  this.taxa[taxon]["medias"][0]["id_media"] +
                  "?h=20"
                : "assets/default_image.png"
          });
        }
      }
    }
    this.autocomplete = "isOn";
  };

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private http: HttpClient,
    private programService: GncProgramsService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngAfterViewInit() {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe((result: FeatureCollection) => {
        this.program = result;
        this.taxonomyListID = this.program.features[0].properties.taxonomy_list;
        this.surveySpecies$ = this.programService
          .getProgramTaxonomyList(this.program_id)
          .pipe(
            tap(species => {
              this.taxa = species;
              this.taxaCount = Object.keys(this.taxa).length;
              if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
                this.inputAutoCompleteSetup();
              } else if (this.taxaCount == 1) {
                this.onTaxonSelected(this.taxa[0]);
              }
            }),
            share()
          );
        this.surveySpecies$.subscribe();

        // build map control
        const formMap = L.map("formMap", { gestureHandling: true });
        this.formMap = formMap;

        L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap"
        }).addTo(formMap);

        L.control["fullscreen"]({
          position: "topright",
          title: {
            false: "View Fullscreen",
            true: "Exit Fullscreen"
          }
        }).addTo(formMap);

        L.control
          .locate({
            icon: 'fa fa-compass',
            position: map_conf.GEOLOCATION_CONTROL_POSITION,
            getLocationBounds: locationEvent =>
              locationEvent.bounds.extend(L.LatLngBounds),
            onLocationError: locationEvent => {
              let msg = "Vous semblez être en dehors de la zone du programme.";
              this.toastr.error(msg, "", { positionClass: "toast-top-right" });
              //alert("Vous semblez être en dehors de la zone du programme")
            },
            locateOptions: {
              enableHighAccuracy: map_conf.GEOLOCATION_HIGH_ACCURACY
            }
          })
          .addTo(formMap);

        let ZoomViewer = L.Control.extend({
          onAdd: () => {
            let container = L.DomUtil.create("div");
            let gauge = L.DomUtil.create("div");
            container.style.width = "200px";
            container.style.background = "rgba(255,255,255,0.5)";
            container.style.textAlign = "left";
            container.className = "mb-0";
            formMap.on("zoomstart zoom zoomend", function(_e) {
              gauge.innerHTML = "Zoom level: " + formMap.getZoom();
            });
            container.appendChild(gauge);

            return container;
          }
        });
        let zv = new ZoomViewer();
        zv.addTo(formMap);
        zv.setPosition("bottomleft");

        const programArea = L.geoJSON(this.program, {
          style: function(_feature) {
            return map_conf.PROGRAM_AREA_STYLE;
          }
        }).addTo(formMap);

        const maxBounds: L.LatLngBounds = programArea.getBounds();
        formMap.fitBounds(maxBounds);
        formMap.setMaxBounds(maxBounds.pad(0.01));

        // Set initial observation marker from main map if already spotted
        let myMarker = null;
        if (this.coords) {
          this.obsForm.patchValue({ geometry: this.coords });

          myMarker = L.marker([this.coords.y, this.coords.x], {
            icon: obsFormMarkerIcon
          }).addTo(formMap);
        }

        // Update marker on click event
        formMap.on("click", (e: LeafletMouseEvent) => {
          let z = formMap.getZoom();

          if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
            // this.hasZoomAlert = true;
            L.DomUtil.addClass(
              formMap.getContainer(),
              "observation-zoom-statement-warning"
            );
            if (this.zoomAlertTimeout) {
              clearTimeout(this.zoomAlertTimeout);
            }
            this.zoomAlertTimeout = setTimeout(() => {
              L.DomUtil.removeClass(
                formMap.getContainer(),
                "observation-zoom-statement-warning"
              );
            }, 2000);
            return;
          }
          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
            if (myMarker) {
              // TODO: update marker coods inplace.
              // Implement draggable marker
              formMap.removeLayer(myMarker);
            }
            myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(
              formMap
            );
            this.coords = L.point(e.latlng.lng, e.latlng.lat);
            this.obsForm.patchValue({ geometry: this.coords });
          }
        });
      });
  }

  onTaxonSelected(taxon: TaxonomyListItem): void {
    this.selectedTaxon = taxon; 
    this.obsForm.controls["cd_nom"].patchValue(taxon.taxref["cd_nom"]);
  }

  onChangeContactCheckBoxRGPD(): void{
      this.obsForm.controls["agreeContactRGPD"].value ?  this.obsForm.controls["email"].enable() : this.obsForm.controls["email"].disable(); 
      this.obsForm.controls["email"].setValue('');
  };

  isSelectedTaxon(taxon: TaxonomyListItem): boolean {
    return this.selectedTaxon === taxon;
  }

  onFormSubmit(): void {
    let obs: ObservationFeature;
    this.postObservation().subscribe(
      (data: PostObservationResponse) => {
        obs = data.features[0];
      },
      err => console.log(err),
      //alert(err),
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

    let formData: FormData = new FormData();

    const files: FileList = this.photo.nativeElement.files;
    if (files.length > 0) {
      formData.append("file", files[0], files[0].name);
    }

    formData.append(
      "geometry",
      JSON.stringify(this.obsForm.get("geometry").value)
    );

    const taxon = this.obsForm.get("cd_nom").value;
    let cd_nom = Number.parseInt(taxon);
    if (isNaN(cd_nom)) {
      cd_nom = Number.parseInt(taxon.cd_nom);
    }
    formData.append("cd_nom", cd_nom.toString());

    const obsDateControlValue = NgbDate.from(this.obsForm.controls.date.value);
    const obsDate = new Date(
      obsDateControlValue.year,
      obsDateControlValue.month - 1,
      obsDateControlValue.day
    );
    const normDate = new Date(
      obsDate.getTime() - obsDate.getTimezoneOffset() * 60 * 1000
    )
      .toISOString()
      .match(/\d{4}-\d{2}-\d{2}/)[0];
    formData.append("date", normDate);

    for (let item of ["count", "comment", "id_program","email"]) {
      formData.append(item, this.obsForm.get(item).value);
    }

    return this.http.post<PostObservationResponse>(
      `${this.URL}/observations`,
      formData,
      httpOptions
    );
  }

  getMediaUrl() {}
}
