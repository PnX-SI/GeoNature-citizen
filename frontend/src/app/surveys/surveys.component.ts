import { Component, OnInit } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from "@angular/common/http";
import { map } from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-surveys",
  templateUrl: "./surveys.component.html",
  styleUrls: ["./surveys.component.css"]
})
export class SurveysComponent implements OnInit {
  title = "Enquêtes";
  surveysApiUrl = "http://0.0.0.0:5001/api/taxonomy/lists/full";
  surveys: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getSurveyListsItems();
  }

  getSurveyListsItems(): void {
    this.restItemsServiceGetRestItems().subscribe(surveys => {
      this.surveys = surveys;
      console.log(surveys);
    });
  }

  restItemsServiceGetRestItems() {
    return this.http.get(this.surveysApiUrl).pipe(map(data => data));
  }
}
