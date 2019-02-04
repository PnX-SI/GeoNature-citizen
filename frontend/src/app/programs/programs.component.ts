import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

// import { AppConfig } from "../../conf/app.config";
import { Program } from "./programs.models";
import { GncProgramsService } from "../api/gnc-programs.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";


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
    // FIXME ProgramsComponent route snapshot data
    // console.debug('ProgramsComponent: route snapshot programs', this.route.snapshot.programs)
    // this.route.data.subscribe((data: { programs: Program[] }) => {

    this.programService.getAllPrograms().subscribe((programs: Program[]) => {
      this.programs = programs;
      console.debug('ProgramsComponent: GncProgramsService call result:', this.programs)
      this.programCount = (this.programs)?this.programs.length:0;
    })
  }
}
