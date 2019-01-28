import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { map } from "rxjs/operators";
import { AppConfig } from "../../../../conf/app.config";

@Component({
  selector: "app-sight-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class SightsListComponent implements OnInit {
  program_id: any;
  sightsFeatures: any;

  constructor(
    // private rest: RestService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.params.subscribe(params => {
      this.program_id = params[`id`];
    });
  }

  ngOnInit() {
    this.getSightsFeatures(this.program_id);
  }

  getSightsFeatures(program_id=1): void {
    this.restItemsServiceGetSightsItems(program_id).subscribe(sights => {
      this.sightsFeatures = sights[`features`];
    });
  }

  restItemsServiceGetSightsItems(program_id=1) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + program_id + `/observations`)
      .pipe(map(data => data));
  }
}
