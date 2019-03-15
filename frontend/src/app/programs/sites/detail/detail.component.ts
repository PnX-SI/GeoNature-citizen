import {Component, AfterViewInit} from '@angular/core';
import {GncProgramsService} from "../../../api/gnc-programs.service";
import {ActivatedRoute} from "@angular/router";
import * as L from "leaflet";
import MaresJson from '../../../../../../config/custom/form/mares.json';

declare let $: any;

export const obsFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
});

@Component({
  selector: 'app-site-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class SiteDetailComponent implements AfterViewInit {
  site_id: any;
  site: any;
  attributes = [];
  photos = [{
    url: "../../assets/Azure-Commun-019.JPG",
    description: "Photo - Anonyme",
    date: "15 mars 2019"
  }, {
    url: "../../assets/faune-mercantour.jpg",
    description: "des bébêtes - Anonyme",
    date: "15 mars 2019"
  }
  ];
  clickedPhoto: any;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
  ) {
    this.route.params.subscribe(params => {
      this.site_id = params["id"];
    });
  }

  ngAfterViewInit() {
    this.programService
      .getSiteDetails(this.site_id)
      .subscribe(sites => {

        console.log(sites);
        this.site = sites['features'][0];

        // setup map
        const formMap = L.map("formMap");
        L.tileLayer("//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap"
        }).addTo(formMap);

        let coord = this.site.geometry.coordinates;
        let latLng = L.latLng(coord[1], coord[0]);
        formMap.setView(latLng, 13);

        L.marker(latLng, { icon: obsFormMarkerIcon })
          .addTo(formMap);

        // prepare data
        let data = this.site.properties.last_visit.json_data;
        let schema = MaresJson.schema.properties;
        for (const k in data) {
          let v = data[k];
          this.attributes.push({name: schema[k].title, value: v.toString()})
        }
      });
  }

  showPhoto(photo) {
    console.log("opening photo:");
    console.log(photo);
    this.clickedPhoto = photo;
    $("#photoModal").modal('show');
  }
}
