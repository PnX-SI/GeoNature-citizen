import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { ModalFlowService } from "./modalflow/modalflow.service";
import { ActivatedRoute } from "@angular/router";
import { Program } from "../programs.models";

@Component({
  selector: "app-observations",
  templateUrl: "./obs.component.html",
  styleUrls: ["./obs.component.css", "../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ObsComponent implements OnInit {
  title = "Observations";
  survey_id: any;
  coords: any;
  programs: Program[];
  program: Program;
  programShortDescription: any;
  programLongDescription: any;

  constructor(
    private route: ActivatedRoute,
    protected domSanitizer: DomSanitizer, // TODO: mv to program service
    public flowService: ModalFlowService
  ) {
    this.route.params.subscribe(params => (this.survey_id = params["id"]));
  }

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
      this.program = this.programs.find(p => p.id_program == this.survey_id);
      this.programShortDescription = this.domSanitizer.bypassSecurityTrustHtml(
        this.program.short_desc
      );
      this.programLongDescription = this.domSanitizer.bypassSecurityTrustHtml(
        this.program.long_desc
      );
    });
  }
}
