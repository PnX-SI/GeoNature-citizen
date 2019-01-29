import { Component, OnInit, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { AppConfig } from "../../conf/app.config";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DescModalComponent } from "./desc-modal/desc-modal.component";
import { GncService } from "../api/gnc.service";
import { GncProgramsService } from "../api/gnc-programs.service";
@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"],
  providers: [GncProgramsService]
})
export class ProgramsComponent implements OnInit {
  title = "Programmes";
  programs: any;
  closeResult: string;
  listprograms: any;
  programFeatures: any;
  programCount: number;

  constructor(
    // private http: HttpClient,
    private modalService: NgbModal,
    private programservice: GncProgramsService
  ) {}

  open(title, long_desc) {
    const modalRef = this.modalService.open(DescModalComponent, { size: "lg" });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.long_desc = long_desc;
  }

  ngOnInit() {
    // this.getSurveyListsItems();
    this.programservice.getAllPrograms().subscribe(programs => {
      this.programs = programs;
      this.programFeatures = this.programs["features"];
      this.programCount = this.programs["count"];
      console.log(programs);
    });
  }
}
