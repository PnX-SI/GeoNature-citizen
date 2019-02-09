import { Component, OnInit, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { FormGroup } from "@angular/forms";
import { map } from "rxjs/operators";

import { AppConfig } from "../../../../conf/app.config";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnInit {
  program_id: any;
  observationsFeatures: any;
  // @Input() formGroup: FormGroup
  surveySpecies: any

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(params => {
      this.program_id = params[`id`];
    });
  }

  ngOnInit() {
    this.getObsFeatures(this.program_id);
  }

  getObsFeatures(program_id=1): void {
    this.restItemsServiceGetObsItems(program_id).subscribe(observations => {
      this.observationsFeatures = observations[`features`];
    });
  }

  restItemsServiceGetObsItems(program_id=1) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + program_id + `/observations`)
      .pipe(map(data => data));
  }

  restItemsServiceGetSurveySpeciesItems(taxlist) {
    return this.http
      .get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/${taxlist}/species`)
      .pipe(map(data => data));
  }

  getSurveySpeciesItems(taxlist): void {
    this.restItemsServiceGetSurveySpeciesItems(taxlist)
        .subscribe(species => this.surveySpecies = species);
  }
}
