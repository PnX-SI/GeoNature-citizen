import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewInit
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { forkJoin } from "rxjs";

import { FeatureCollection } from "geojson";

import { GncProgramsService } from "../../api/gnc-programs.service";
import { Program } from "../programs.models";
import { ModalFlowService } from "./modalflow/modalflow.service";
import { TaxonomyList } from "./observation.model";

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsComponent implements OnInit, AfterViewInit {
  fragment: string;
  program_id: any;
  coords: any;
  programs: Program[];
  program: Program;
  observations: FeatureCollection;
  programFeature: FeatureCollection;
  surveySpecies: TaxonomyList;

  constructor(
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
}
