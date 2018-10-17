import { Component, OnInit, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { AppConfig } from "../../conf/app.config";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DescModalComponent } from './desc-modal/desc-modal.component';
@Component({
  selector: "app-programs",
  templateUrl: "./programs.component.html",
  styleUrls: ["./programs.component.css"]
})
export class ProgramsComponent implements OnInit {
  title = "Programmes";
  programs: any;
  closeResult: string;

  constructor(private http: HttpClient, private modalService: NgbModal) {}

  open(nom_liste, desc_liste) {
    const modalRef = this.modalService.open(DescModalComponent, { size: 'lg' });
    modalRef.componentInstance.desc_liste = desc_liste;
    modalRef.componentInstance.nom_liste = nom_liste;
  }

  getSurveyListsItems(): void {
    this.restItemsServiceGetRestItems().subscribe(programs => {
      this.programs = programs;
      console.log(programs);
    });
  }

  restItemsServiceGetRestItems() {
    console.log("URL: ", `${AppConfig.API_ENDPOINT}/taxonomy/lists/full`);
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/full`)
      .pipe(map(data => data));
  }

  ngOnInit() {
    this.getSurveyListsItems();
  }
}
