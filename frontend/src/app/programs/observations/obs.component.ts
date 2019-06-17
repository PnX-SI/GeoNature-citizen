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
import { ActivatedRoute } from "@angular/router";
import { forkJoin } from "rxjs";

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
  @ViewChild(ObsMapComponent) obsMap: ObsMapComponent;
  @ViewChild(ObsListComponent) obsList: ObsListComponent;

  selectedObs: Feature;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    public flowService: ModalFlowService
  ) {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });
  }

  ngOnInit() {
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
      alert(e);
    }
  }

  onMapClicked(p: L.Point): void {
    this.coords = p;
  }

  toggleList() {
    this.obsMap.observationMap.invalidateSize();
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  newObservationEventHandler(e: CustomEvent) {
    e.stopPropagation();
    this.observations.features.unshift(e.detail);
    this.observations = {
      type: "FeatureCollection",
      features: this.observations.features
    };
    this.obsList.observations = {
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
}
