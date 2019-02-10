import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";

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
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    protected domSanitizer: DomSanitizer // TODO: mv to program service
  ) {}

  ngOnInit() {
    // console.debug('route snapshot', this.route.snapshot.data)
    this.programService.getAllPrograms().subscribe(programs => {
      this.programs = programs.map(p => {
        p.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(
          p.short_desc
        );
        p.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(
          p.long_desc
        );
        return p;
      });
      console.debug(
        "ProgramsComponent: GncProgramsService call result:",
        this.programs
      );
      this.programCount = this.programs ? this.programs.length : 0;
    });
  }
}
