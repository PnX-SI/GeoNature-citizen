import { Component, OnInit } from '@angular/core';
import { SiteModalFlowService } from "../modalflow/modalflow.service";
import {GncProgramsService} from "../../../api/gnc-programs.service";
import {ActivatedRoute} from "@angular/router";
import { Feature } from "geojson";

@Component({
  selector: 'app-site-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class SiteDetailComponent implements OnInit {
  site_id: any;
  site: Feature;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
  ) {
    this.route.params.subscribe(params => {
      this.site_id = params["id"];
    });
  }

  ngOnInit() {
    console.debug("getting site");
    this.programService
      .getSiteDetails(this.site_id)
      .subscribe(sites => {
        console.log(sites);
        this.site = sites['features'][0];
        console.log(this.site);
      });
  }

}
