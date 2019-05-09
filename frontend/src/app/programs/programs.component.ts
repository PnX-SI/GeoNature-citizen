import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

// import { AppConfig } from "../../conf/app.config";
import { Program } from "./programs.models";
import { GncProgramsService } from "../api/gnc-programs.service";
import { ProgramsResolve } from "../programs/programs-resolve.service";

@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ProgramsComponent implements OnInit {
  programs: Program[];
  programCount: number;

  constructor(
    private route: ActivatedRoute,
    public activeModal: NgbActiveModal,
    private programService: GncProgramsService
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
    });
    if (!this.programs) {
      this.programService.getAllPrograms().subscribe(programs => {
        this.programs = programs;
        this.programCount = this.programs ? this.programs.length : 0;
      });
    }
  }
}
