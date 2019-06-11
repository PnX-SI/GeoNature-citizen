import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { Position, Point } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";
import "leaflet-fullscreen/dist/Leaflet.fullscreen";
import "leaflet-gesture-handling";

import { AppConfig } from "../../../../conf/app.config";
import { MAP_CONFIG } from "../../../../conf/map.config";

declare let $: any;

const PROGRAM_AREA_STYLE = {
  fillColor: "transparent",
  weight: 2,
  opacity: 0.8,
  color: "red",
  dashArray: "4"
};

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const siteFormMarkerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
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
  @Input("coords") coords: L.Point;
  @Input("program_id") program_id: number;
  @ViewChild("photo") photo: ElementRef;
  program: any;
  formMap: L.Map;
  siteForm = new FormGroup({
    name: new FormControl("", Validators.required),
    geometry: new FormControl("", Validators.required),
    id_program: new FormControl(),
    site_type: new FormControl()
  });
  MAP_CONFIG = MAP_CONFIG;
  hasZoomAlert: boolean;
  zoomAlertTimeout: any;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe(result => {
        this.program = result;

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
            return PROGRAM_AREA_STYLE;
          }
        }).addTo(formMap);

        const maxBounds: L.LatLngBounds = programArea.getBounds();
        formMap.fitBounds(maxBounds);
        formMap.setMaxBounds(maxBounds);

        // Set initial observation marker from main map if already spotted
        let myMarker = null;
        if (this.coords) {
          let geo_coords = <Point>{
              type: "Point",
              coordinates: <Position>[this.coords.x, this.coords.y]
            };
          this.siteForm.patchValue({ geometry: geo_coords });

          myMarker = L.marker([this.coords.y, this.coords.x], {
            icon: siteFormMarkerIcon
          }).addTo(formMap);
        }

        // Update marker on click event
        formMap.on("click", (e: LeafletMouseEvent) => {
          let z = formMap.getZoom();

          if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
            // this.hasZoomAlert = true;
            console.debug("ZOOM ALERT", formMap);
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
              console.debug("Deactivating overlay", formMap);
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
            myMarker = L.marker(e.latlng, { icon: siteFormMarkerIcon }).addTo(
              formMap
            );
            this.coords = L.point(e.latlng.lng, e.latlng.lat);
            // this.siteForm.patchValue({ geometry: this.coords });
            let coords = <Point>{
              type: "Point",
              coordinates: <Position>[e.latlng.lng, e.latlng.lat]
            };
            this.siteForm.patchValue({ geometry: coords });
          }
        });
      });
  }

  onFormSubmit(): Promise<object>  {
    console.debug("formValues:", this.siteForm.value);

    return this.postSite().toPromise().then(
      data => { return data; },
      err => console.error(err)
    );
  }

  postSite(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json"
      })
    };
    this.siteForm.patchValue({
        id_program: this.program_id,
        site_type: "mare" // TODO : get site type
    });
    return this.http.post<any>(
      `${this.URL}/sites/`,
      this.siteForm.value,
      httpOptions
    );
  }
}
