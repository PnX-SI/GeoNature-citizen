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

import { GNCFrameworkComponent } from './framework/framework.component';
import MaresJson from '../../../../../../config/custom/form/mares.json';

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const siteFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
});
export const myMarkerTitle =
  '<i class="fa fa-eye"></i> Partagez votre site';

@Component({
  selector: "app-site-visit-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteVisitFormComponent implements OnInit, AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  @Input() site_id: number;
  visitForm = new FormGroup({
    date: new FormControl("", Validators.required),
    data: new FormControl("", Validators.required)
  });
  currentStep: number = 1;
  partialLayout: any;
  advancedMode: boolean = false;
  jsonData: object = {};
  formOptions: any = {
    "loadExternalAssets": false,
    "debug": false,
    "returnEmptyFields": false,
    "addSubmit": false
  }
  jsonSchema: any;
  GNCBootstrap4Framework: any = {
    framework: GNCFrameworkComponent,
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    console.debug("ngOnInit");
    console.debug(MaresJson);
    this.jsonSchema = MaresJson;
    this.updatePartialLayout();
    console.debug("site_id:", this.site_id);
  }

  ngAfterViewInit() {
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
    console.debug("formValues:", this.visitForm.value);
    this.postSiteVisit().subscribe(
      data => console.debug(data),
      err => console.error(err),
      () => console.log("done")
      // TODO: queue obs in list
    );
  }

  postSiteVisit(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };
    let visitDate = NgbDate.from(this.visitForm.controls.date.value);
    this.visitForm.patchValue({
      data: this.jsonData,
      date: new Date(visitDate.year, visitDate.month, visitDate.day)
        .toISOString()
        .match(/\d{4}-\d{2}-\d{2}/)[0]
    });
    return this.http.post<any>(
      `${this.URL}/sites/${this.site_id}/visits`,
      this.visitForm.value,
      httpOptions
    );
  }
}