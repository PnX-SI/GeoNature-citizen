import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppConfig} from '../../../../conf/app.config';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-sight-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SightsFormComponent implements AfterViewInit {
  coords: any;
  sightForm = new FormGroup({
    species: new FormControl('', Validators.required),
    count: new FormControl('', Validators.required),
    comment: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required)
  });
  surveySpecies: any;
  taxonomyList: any;
  program: any;
  program_id: any;

  constructor(
    // private rest: RestService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe(params => this.program_id = params['id'])
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + this.program_id)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
        console.log('TAXXLIST', this.taxonomyList);
      })
  }

  ngAfterViewInit(): void {
    console.log('taxlist', this.taxonomyList);
    this.getSurveySpeciesItems(this.taxonomyList);
    this.onFormSubmit();
  }

  onFormSubmit(): void {
    console.log('sightForm: ', this.sightForm);
    console.log('formValues:' + this.sightForm.value);
  }

  restItemsServiceGetTaxonomyList(program_id) {
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + program_id)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
      });
  }

  restItemsServiceGetSurveySpeciesItems(taxlist) {
    return this.http
      .get(
        `${AppConfig.API_ENDPOINT}/taxonomy/lists/` +
        taxlist +
        `/species`
      )
      .pipe(map(data => data));
  }

  getSurveySpeciesItems(taxlist): void {
    this.restItemsServiceGetSurveySpeciesItems(taxlist).subscribe(species => {
      this.surveySpecies = species;
    });
  }
}
