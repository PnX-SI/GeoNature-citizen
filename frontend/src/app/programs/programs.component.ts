import { Component, OnInit, ViewEncapsulation } from "@angular/core";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

// import { AppConfig } from "../../conf/app.config";
import { Program } from "./programs.models";
import { GncProgramsService } from "../api/gnc-programs.service";

@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ProgramsComponent implements OnInit {
  title = "Programmes";
  programs: Program[];
  programCount: number;

  constructor(
    public activeModal: NgbActiveModal,
    private programService: GncProgramsService
  ) {}

  ngOnInit() {
    if (!this.programs) {
      this.programService.getAllPrograms().subscribe(programs => {
        this.programs = programs;
        console.debug(
          "ProgramsComponent: GncProgramsService call result:",
          this.programs
        );
        this.programCount = this.programs ? this.programs.length : 0;
      });
    }
  }
}
