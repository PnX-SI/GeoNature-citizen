import { Component, OnInit, ViewEncapsulation, Inject, LOCALE_ID } from "@angular/core";

import { ActivatedRoute } from "@angular/router";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../conf/app.config";
import { Program } from "./programs.models";
import { GncProgramsService } from "../api/gnc-programs.service";
import { ProgramsResolve } from "../programs/programs-resolve.service";
import { Subject } from "rxjs";
// import { count } from "rxjs/operators";

@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class ProgramsComponent implements OnInit {
  programs$ = new Subject<Program[]>();
  AppConfig = AppConfig;
  // programCount$ = this.programs$.pipe(count());

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private route: ActivatedRoute,
    public activeModal: NgbActiveModal,
    private programService: GncProgramsService
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      if (data.programs) {
        this.programs$.next(data.programs);
      } else {
        this.programService
          .getAllPrograms()
          .subscribe(programs => this.programs$.next(programs));
      }
    });
  }
}
