import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { geometryValidator, ngbDateMaxIsToday } from "./formValidators";
import { MAP_CONFIG } from "./../../../../conf/map.config";
import * as L from "leaflet";

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
import { AuthService } from "./../../../auth/auth.service";
import {
  debounceTime,
  distinctUntilChanged,
  map,
  share,
  tap
} from "rxjs/operators";
import { FeatureCollection } from "geojson";
import { GncProgramsService } from "../../../api/gnc-programs.service";
import { LeafletMouseEvent } from "leaflet";
import { NgbDate, NgbDateParserFormatter } from "@ng-bootstrap/ng-bootstrap";
import { Observable } from "rxjs";
import {
  ObservationFeature,
  PostObservationResponse,
  TaxonomyList
} from "../observation.model";
import "leaflet-gesture-handling";
import "leaflet-fullscreen/dist/Leaflet.fullscreen";
import { ToastrService } from "ngx-toastr";
import { ModalFlowService } from "../modalflow/modalflow.service";
import { ObservationsService } from "../observations.service";

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

@Component({
  selector: "app-obs-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  @Input("data") data;
  @Output("newObservation") newObservation: EventEmitter<
    ObservationFeature
  > = new EventEmitter();
  @ViewChild("photo", { static: true }) photo: ElementRef;
  today = new Date();
  program_id: number;
  coords: L.Point;
  modalflow;
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
  obsForm: FormGroup;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private observationsService: ObservationsService,
    private formBuilder: FormBuilder,
    private dateParser: NgbDateParserFormatter,
    private programService: GncProgramsService,
    private flowService: ModalFlowService,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.program_id = this.data.program_id;
    this.coords = this.data.coords;
    this.intiForm();
    if (this.data.updateData) this.patchForm(this.data.updateData);
  }

  ngAfterViewInit() {
    this.programService
      .getProgram(this.program_id)
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
        const formMap = L.map("formMap", { gestureHandling: true } as any);
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
            icon: "fa fa-compass",
            position: map_conf.GEOLOCATION_CONTROL_POSITION,
            strings: {
              title: MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId] ? MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId] : 'Me géolocaliser'
            },
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
          } as any )
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

  intiForm() {
    this.obsForm = this.formBuilder.group(
      {
        cd_nom: ["", Validators.required],
        count: [1, Validators.required],
        comment: [""],
        date: [
          {
            year: this.today.getFullYear(),
            month: this.today.getMonth() + 1,
            day: this.today.getDate()
          },
          [Validators.required, ngbDateMaxIsToday()]
        ],
        photo: [""],
        geometry: [
          this.data.coords ? this.coords : "",
          [Validators.required, geometryValidator()]
        ],
        id_program: [this.program_id],
        email: [{ value: "", disabled: true }],
        agreeContactRGPD: [""]
      }
      //{ updateOn: "submit" }
    );
  }

  patchForm(updateData) {
    this.onTaxonSelected(updateData.taxon);
    this.obsForm.patchValue({
      count: updateData.count,
      comment: updateData.comment,
      date: this.dateParser.parse(updateData.date),
      geometry: this.data.coords ? this.coords : "",
      id_program: updateData.program_id
    });

  }

  inputAutoCompleteSetup = () => {
    for (let taxon in this.taxa) {
      for (let field of taxonAutocompleteFields) {
        if (this.taxa[taxon]["taxref"][field]) {
          this.species.push({
            name:
              field === "cd_nom"
                ? `${this.taxa[taxon]["taxref"]["cd_nom"]} - ${this.taxa[taxon]["taxref"]["nom_complet"]}`
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

  inputAutoCompleteSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term =>
        term === "" // term.length < n
          ? []
          : this.species
              .filter(
                v => v["name"].toLowerCase().indexOf(term.toLowerCase()) > -1
                // v => new RegExp(term, "gi").test(v["name"])
              )
              .slice(0, taxonAutocompleteMaxResults)
      )
    );

  inputAutoCompleteFormatter = (x: { name: string }) => x.name;
  disabledDates = (date: NgbDate, current: { month: number }) => {
    const date_impl = new Date(date.year, date.month - 1, date.day);
    return date_impl > this.today;
  };

  onTaxonSelected(taxon: any): void {
    this.selectedTaxon = taxon;
    this.obsForm.controls["cd_nom"].patchValue({
      cd_nom: taxon.taxref["cd_nom"],
      name: taxon.taxref.nom_complet
    });
  }

  onChangeContactCheckBoxRGPD(): void {
    this.obsForm.controls["agreeContactRGPD"].value
      ? this.obsForm.controls["email"].enable()
      : this.obsForm.controls["email"].disable();
    this.obsForm.controls["email"].setValue("");
  }

  isSelectedTaxon(taxon: any): boolean {
    if (this.selectedTaxon)
      return this.selectedTaxon.taxref.cd_nom === taxon.taxref.cd_nom;
  }

  onFormSubmit(): void {
    this.postObservation();
  }

  creatFromDataToPost(): FormData {
    this.obsForm.controls["id_program"].patchValue(this.program_id);
    let formData: FormData = new FormData();
    if (!this.data.updateData) {
      const files: FileList = this.photo.nativeElement.files;
      if (files.length > 0) {
        formData.append("file", files[0], files[0].name);
      }
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
    for (let item of ["count", "comment", "id_program", "email"]) {
      formData.append(item, this.obsForm.get(item).value);
    }
    return formData;
  }

  postObservation() {
    let obs: ObservationFeature;
    let formData = this.creatFromDataToPost();
    this.observationsService.postObservation(formData).subscribe(
      (data: PostObservationResponse) => {     
        obs = data.features[0];
        if (obs.properties.observer) {
          obs.properties.observer.userAvatar = localStorage.getItem('userAvatar')
        }
        this.newObservation.emit(obs);
        this.flowService.setModalCloseSatus("newObs");
      },
      err => console.error(err)
    );
  }

  onFormUpdate(): void {
    let formData = this.creatFromDataToPost();
    formData.append(
      "id_observation",
      this.data.updateData.id_observation.toString()
    );
    this.observationsService.updateObservation(formData).subscribe(() => {
      this.flowService.closeModal();
      this.flowService.setModalCloseSatus("updateObs");
    });
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth.authorized$.pipe(
      map(value => {
        return value;
      })
    );
  }
}
