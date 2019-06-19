import {Component, AfterViewInit, ViewEncapsulation} from '@angular/core';
import {GncProgramsService} from "../../../api/gnc-programs.service";
import {ActivatedRoute} from "@angular/router";
import * as L from "leaflet";
import MaresJson from '../../../../../../config/custom/form/mares.json';
import { SiteModalFlowService } from "../modalflow/modalflow.service";
import {AppConfig} from "../../../../conf/app.config";

declare let $: any;

export const markerIcon = L.icon({
  iconUrl: "assets/pointer-blue2.png",
  iconAnchor: [16, 42]
});

@Component({
  selector: 'app-site-detail',
  templateUrl: './detail.component.html',
  styleUrls: [
    './../../observations/obs.component.css', // for form modal only
    './detail.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SiteDetailComponent implements AfterViewInit {
  site_id: any;
  program_id: any;
  site: any;
  attributes = [];
  photos = [];
  clickedPhoto: any;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: SiteModalFlowService
  ) {
    this.route.params.subscribe(params => {
      this.site_id = params["site_id"];
      this.program_id = params["program_id"];
    });
  }

  ngAfterViewInit() {
    this.programService
      .getSiteDetails(this.site_id)
      .subscribe(sites => {
        this.site = sites['features'][0];

        this.photos = this.site.properties.photos;
        for (var i = 0; i<this.photos.length; i++){
          this.photos[i]['url'] = AppConfig.API_ENDPOINT + this.photos[i]['url'];
        }

        // setup map
        const map = L.map("map");
        L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap"
        }).addTo(map);

        let coord = this.site.geometry.coordinates;
        let latLng = L.latLng(coord[1], coord[0]);
        map.setView(latLng, 13);

        L.marker(latLng, { icon: markerIcon })
          .addTo(map);

        // prepare data
        if (this.site.properties.last_visit) {
          let data = this.site.properties.last_visit.json_data;
          let schema = MaresJson.schema.properties;
          for (const k in data) {
            let v = data[k];
            this.attributes.push({name: schema[k].title, value: v.toString()})
          }
        }
      });
  }

  showPhoto(photo) {
    console.log("opening photo:");
    console.log(photo);
    this.clickedPhoto = photo;
    $("#photoModal").modal('show');
  }

  addSiteVisit() {
    this.flowService.addSiteVisit(this.site_id);
  }
}
