import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewChecked,
  ViewChild
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { FeatureCollection } from "geojson";

import { GncProgramsService } from "../../api/gnc-programs.service";
import { Program } from "../programs.models";
import { SiteModalFlowService } from "./modalflow/modalflow.service";
import { SiteService } from "./sites.service";
import { SitesMapComponent } from "./map/map.component";
import { SitesListComponent } from "./list/list.component";

@Component({
  selector: "app-sites",
  templateUrl: "./sites.component.html",
  styleUrls: ["../observations/obs.component.css", "../../home/home.component.css", "./sites.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SitesComponent implements OnInit, AfterViewChecked {
  title = "Sites";
  fragment: string;
  program_id: any;
  coords: any;
  programs: Program[];
  program: Program;
  sites: FeatureCollection;
  programFeature: FeatureCollection;
  surveySpecies: any;
  @ViewChild(SitesMapComponent) sitesMap: SitesMapComponent;
  @ViewChild(SitesListComponent) sitesList: SitesListComponent;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: SiteModalFlowService,
    public siteService: SiteService
  ) {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });
    this.siteService.newSiteCreated.subscribe(
      newSiteFeature => { this.loadSites(); })
  }

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      // TODO: merge observables
      this.programs = data.programs;
      this.program = this.programs.find(p => p.id_program == this.program_id);
      this.loadSites();
      this.programService
        .getProgramTaxonomyList(this.program_id)
        .subscribe(taxa => {
          this.surveySpecies = taxa;
        });
      this.programService
        .getProgram(this.program_id)
        .subscribe(program => (this.programFeature = program));
    });
  }

  loadSites() {
    this.programService
        .getProgramSites(this.program_id)
        .subscribe(sites => {
          this.sites = sites;
        });
  }

  ngAfterViewChecked(): void {
    try {
      if (this.fragment) {
        document
          .querySelector("#" + this.fragment)
          .scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      alert(e);
    }
  }

  onMapClicked(p): void {
    this.coords = p;
    console.debug("map clicked", this.coords);
  }
}
