import {
  Component,
  ViewEncapsulation,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  ElementRef
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { Position, Point } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";

// import { GNCBootstrap4Framework } from './framework/framework.ts';
// import { FrameworkLibraryService } from 'angular6-json-schema-form';
// constructor(frameworkLibrary: FrameworkLibraryService) { }
// frameworkLibrary.setFramework(GNCBootstrap4Framework);
import { Bootstrap4FrameworkModule } from 'angular6-json-schema-form';
import MaresJson from '../../../../../../config/custom/form/mares.json';

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
  selector: "app-site-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteFormComponent implements OnInit, AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  currentStep: number = 1;
  currentMode: string = "basic";
  partialLayout: any;
  advancedMode: boolean = false;
  jsonData: object = {};
  formOptions: any = {
    "loadExternalAssets": false,
    "debug": true,
    "returnEmptyFields": false,
    "addSubmit": false
  }
  jsonSchema: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    console.debug("ngOnInit");
    console.debug(MaresJson);
    this.jsonSchema = MaresJson;
    this.updatePartialLayout();
  }

  ngAfterViewInit() {
    console.debug("AfterViewInit", MaresJson);
    // this.route.params.subscribe(params => (this.program_id = params["id"]));
    // this.http
    //   .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
    //   .subscribe(result => {
    //     this.program = result;
    //     this.taxonomyList = this.program.features[0].properties.taxonomy_list;
    //     this.getSurveySpeciesItems(this.taxonomyList);

    //     const formMap = L.map("formMap");

    //     L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //       attribution: "OpenStreetMap"
    //     }).addTo(formMap);

    //     const programArea = L.geoJSON(this.program, {
    //       style: function(_feature) {
    //         return {
    //           fillColor: "transparent",
    //           weight: 2,
    //           opacity: 0.8,
    //           color: "red",
    //           dashArray: "4"
    //         };
    //       }
    //     }).addTo(formMap);

    //     const maxBounds: L.LatLngBounds = programArea.getBounds();
    //     formMap.fitBounds(maxBounds);
    //     formMap.setMaxBounds(maxBounds);

    //     let myMarker = null;

    //     formMap.on("click", <LeafletMouseEvent>(e) => {
    //       let coords = <Point>{
    //         type: "Point",
    //         coordinates: <Position>[e.latlng.lng, e.latlng.lat]
    //       };
    //       this.obsForm.patchValue({ geometry: coords });
    //       // TODO: this.obsForm.patchValue({ municipality: municipality });
    //       console.debug(coords);

    //       if (myMarker !== null) {
    //         formMap.removeLayer(myMarker);
    //       }

    //       // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
    //       // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
    //       if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
    //         myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(
    //           formMap
    //         );
    //         $("#feature-title").html(myMarkerTitle);
    //         $("#feature-coords").html(coords);
    //         // $("#feature-info").html(myMarkerContent);
    //         $("#featureModal").modal("show");
    //       }
    //     });
    //   });
  }

  nextStep() {
    this.currentStep += 1;
    this.updatePartialLayout();
  }
  previousStep() {
    this.currentStep -= 1;
    this.updatePartialLayout();
  }
  updatePartialLayout() {
    this.partialLayout = this.jsonSchema.steps[this.currentStep - 1].layout;
    this.partialLayout[this.partialLayout.length - 1].expanded = this.advancedMode;
  }
  isFirstStep() {
    return this.currentStep === 1;
  }
  isLastStep() {
    return this.currentStep === this.jsonSchema.steps.length;
  }
  yourOnChangesFn(e) {
    // console.log(e)
  }
  toogleAdvancedMode() {
    this.advancedMode = !this.advancedMode;
    this.updatePartialLayout();
  }
  onFormSubmit(): void {
    // console.debug("formValues:", this.obsForm.value);
    // this.postObservation().subscribe(
    //   data => console.debug(data),
    //   err => console.error(err),
    //   () => console.log("done")
    //   // TODO: queue obs in list
    // );
  }
}
