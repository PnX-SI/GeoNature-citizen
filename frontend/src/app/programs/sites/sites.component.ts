import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ViewChildren,
  QueryList
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { FeatureCollection } from "geojson";

import { GncProgramsService } from "../../api/gnc-programs.service";
import { Program } from "../programs.models";
import { SiteModalFlowService } from "./modalflow/modalflow.service";
import { TaxonomyList } from "../observations/observation.model";
import { SiteService } from "./sites.service";
import { SitesMapComponent } from "./map/map.component";
import { SitesListComponent } from "./list/list.component";
import { SiteModalFlowComponent } from "./modalflow/modalflow.component";
import { ProgramBaseComponent } from "../base/program-base.component";

@Component({
  selector: "app-sites",
  templateUrl: "./sites.component.html",
  styleUrls: ["../observations/obs.component.css", "../../home/home.component.css", "./sites.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SitesComponent extends ProgramBaseComponent implements OnInit {
  title = "Sites";
  sites: FeatureCollection;
  @ViewChild(SitesMapComponent, { static: true }) sitesMap: SitesMapComponent;
  @ViewChild(SitesListComponent, { static: true }) sitesList: SitesListComponent;
  @ViewChildren(SiteModalFlowComponent) modalFlow: QueryList<SiteModalFlowComponent>;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: SiteModalFlowService,
    public siteService: SiteService
  ) {
    super()
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });
    this.siteService.newSiteCreated.subscribe(newSiteFeature => { this.loadSites(); })
  }

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      // TODO: merge observables
      this.programs = data.programs;
      this.program = this.programs.find(p => p.id_program == this.program_id);
      this.loadSites();
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

  addSiteClicked () {
    this.modalFlow.first.clicked();
  }
}
