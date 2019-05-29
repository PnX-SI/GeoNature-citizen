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
import { map, tap } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { Position, Point } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const siteFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
});
export const myMarkerTitle =
  '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
  selector: "app-site-form",
  templateUrl: "./siteform.component.html",
  styleUrls: ["./siteform.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  @ViewChild("photo") photo: ElementRef;
  program: any;
  program_id: any;
  formMap: any;
  siteForm = new FormGroup({
    name: new FormControl("", Validators.required),
    geometry: new FormControl("", Validators.required),
    id_program: new FormControl(this.program_id),
    site_type: new FormControl("mare") // TODO : get site type
  });

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe(result => {
        this.program = result;

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
          this.siteForm.patchValue({ geometry: coords });
          // TODO: this.siteForm.patchValue({ municipality: municipality });
          console.debug(coords);

          if (myMarker !== null) {
            formMap.removeLayer(myMarker);
          }

          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
            myMarker = L.marker(e.latlng, { icon: siteFormMarkerIcon }).addTo(
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

  onFormSubmit(): Promise<object>  {
    console.debug("formValues:", this.siteForm.value);

    return this.postSite().toPromise().then(
      data => { console.debug(data); return data; },
      err => console.error(err)
    );
  }

  postSite(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };

    return this.http.post<any>(
      `${this.URL}/sites/`,
      this.siteForm.value,
      httpOptions
    );
  }
}
