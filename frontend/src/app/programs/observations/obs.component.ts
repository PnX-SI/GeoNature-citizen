import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  HostListener,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from "@angular/router";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { forkJoin } from "rxjs";
import {Router} from "@angular/router";
import { FeatureCollection, Feature } from "geojson";
import * as L from "leaflet";

import { Program } from "../programs.models";
import { ProgramsResolve } from "../../programs/programs-resolve.service";
import { GncProgramsService } from "../../api/gnc-programs.service";
import { ModalFlowService } from "./modalflow/modalflow.service";
import { TaxonomyList } from "./observation.model";
import { ObsMapComponent } from "./map/map.component";
import { ObsListComponent } from "./list/list.component";
import { AppConfig } from "../../../conf/app.config";

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ObsComponent implements OnInit, AfterViewInit {
  AppConfig = AppConfig;
  fragment: string;
  coords: L.Point;
  program_id: any;
  programs: Program[];
  program: Program;
  observations: FeatureCollection;
  programFeature: FeatureCollection;
  surveySpecies: TaxonomyList;
  @ViewChild(ObsMapComponent, { static: true }) obsMap: ObsMapComponent;
  @ViewChild(ObsListComponent, { static: true }) obsList: ObsListComponent;

  selectedObs: Feature;
  public isCollapsed: boolean = true;
  isMobile: boolean;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private route: ActivatedRoute,
    private router: Router ,
    private programService: GncProgramsService,
    public flowService: ModalFlowService,
    public breakpointObserver: BreakpointObserver,
    private titleService: Title,
    private metaTagService: Meta
  ) {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });
  }

  ngOnInit() {
    this.breakpointObserver
      .observe(["(min-width: 700px)"])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobile = false;
        } else {
          this.isMobile = true;
        }
      });

    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
      this.program = this.programs.find(p => p.id_program == this.program_id);
      forkJoin(
        this.programService.getProgramObservations(this.program_id),
        this.programService.getProgramTaxonomyList(this.program_id),
        this.programService.getProgram(this.program_id)
      ).subscribe(([observations, taxa, program]) => {
        this.observations = observations;
        this.surveySpecies = taxa;
        this.programFeature = program;
      });
      this.titleService.setTitle(this.AppConfig.appName + ' - ' + this.program.title);
      this.metaTagService.updateTag(
        { name: 'description', content: this.program.short_desc }
      );
      this.metaTagService.updateTag({ property: 'og:title', content: AppConfig.appName +' - '+this.program.title});
      this.metaTagService.updateTag({ property: 'og:description', content: this.program.short_desc });
      this.metaTagService.updateTag({ property: 'og:image', content: this.program.image });
      this.metaTagService.updateTag({ property: 'og:url', content: AppConfig.URL_APPLICATION+this.router.url });
      this.metaTagService.updateTag({ property: 'twitter:title', content: AppConfig.appName +' - '+this.program.title});
      this.metaTagService.updateTag({ property: 'twitter:description', content: this.program.short_desc });
      this.metaTagService.updateTag({ property: 'twitter:image', content: this.program.image });
    });
  }

  ngAfterViewInit(): void {
    try {
      if (this.fragment) {
        document
          .querySelector("#" + this.fragment)
          .scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      //alert(e);
    }
  }

  onMapClicked(p: L.Point): void {
    this.coords = p;
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();

    this.observations.features.unshift(e.detail);
    this.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
  }

  @HostListener("document:ObservationFilterEvent", ["$event"])
  observationFilterEventHandler(e: CustomEvent) {
    e.stopPropagation();
    this.obsList.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
  }

  ngOnDestroy(): void {
    this.flowService.closeModal();
  }
}
