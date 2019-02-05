import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

// import { AppConfig } from "../../conf/app.config";
import { Program } from "./programs.models";
import { GncProgramsService } from "../api/gnc-programs.service";


@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"],
  providers: [
    GncProgramsService,
    NgbActiveModal,
  ]
})
export class ProgramsComponent implements OnInit {
  title = "Programmes";
  programs: Program[];
  programCount: number;

  constructor(
    private modal: NgbActiveModal,
    private route: ActivatedRoute,
    private programService: GncProgramsService,
  ) {}

  ngOnInit() {
    this.programService.getAllPrograms().subscribe(
      programs => {
        this.programs = programs;
        console.debug('ProgramsComponent: GncProgramsService call result:', this.programs)
        this.programCount = (this.programs)?this.programs.length:0;
    })
  }

  close() {
    this.modal.close('PROGRAM_SELECTED')
  }
}
