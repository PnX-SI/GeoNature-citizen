import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {AppConfig} from '../../conf/app.config';

@Component({
  selector: 'app-surveys',
  templateUrl: './surveys.component.html',
  styleUrls: ['./surveys.component.css']
})
export class SurveysComponent implements OnInit {
  title = 'Enquêtes';
  surveys: any;

  constructor(private http: HttpClient) {
  }

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
    console.log('URL: ', `${AppConfig.API_ENDPOINT}/taxonomy/lists/full`);
    return this.http.get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/full`).pipe(map(data => data));
  }
}
