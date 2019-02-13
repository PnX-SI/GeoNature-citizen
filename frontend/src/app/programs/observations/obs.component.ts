import { Component, OnInit, ViewEncapsulation } from "@angular/core";

import { ModalFlowService } from "./modalflow/modalflow.service";
import { ActivatedRoute } from "@angular/router";
import { Program } from "../programs.models";
// import { Observation } from "./observation.model";
import { GncProgramsService } from "../../api/gnc-programs.service";
import { FeatureCollection } from "geojson";

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsComponent implements OnInit {
  title = "Observations";
  program_id: any;
  coords: any;
  programs: Program[];
  program: Program;
  observations: FeatureCollection;
  programFeature: FeatureCollection;
  surveySpecies: any[];

  constructor(
    private route: ActivatedRoute,
    public flowService: ModalFlowService,
    private programService: GncProgramsService
  ) {
    this.route.params.subscribe(params => (this.program_id = params["id"]));
  }

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      // TODO: merge observables
      this.programs = data.programs;
      this.program = this.programs.find(p => p.id_program == this.program_id);
      this.programService
        .getProgramObservations(this.program_id)
        .subscribe(observations => {
          this.observations = observations;
        });
      this.programService
        .getProgramTaxonomyList(this.program_id)
        .subscribe(taxa => {
          this.surveySpecies = taxa;
        });
      this.programService.getProgram(this.program_id).subscribe(program => {
        this.programFeature = program;
      });
    });
  }
}
