import {AfterViewInit, Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppConfig} from '../../../../conf/app.config';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {Sight} from './sight';

@Component({
  selector: 'app-sight-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})

export class SightsFormComponent implements AfterViewInit {
  coords: any;
  sightForm = new FormGroup({
    species: new FormControl('', Validators.required),
    count: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required)
  });
  survey_id: any;
  surveySpecies: any;

  constructor(
    // private rest: RestService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'];
    });
  }

  ngAfterViewInit(): void {
    console.log('PARAMS FORMS', this.survey_id);
    this.getSurveySpeciesItems();
    this.onFormSubmit();
  }

  onFormSubmit(): void {
    console.log('sightForm: ', this.sightForm)
    console.log('formValues:' + this.sightForm.value);
  }

  getSurveySpeciesItems(): void {
    this.restItemsServiceGetSurveySpeciesItems().subscribe(species => {
      this.surveySpecies = species;
    });
  }

  restItemsServiceGetSurveySpeciesItems() {
    return this.http.get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/` + this.survey_id + `/species`).pipe(map(data => data));
  }

}
