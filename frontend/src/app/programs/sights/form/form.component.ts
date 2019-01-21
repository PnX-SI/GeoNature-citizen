import { OnInit, Component, ViewEncapsulation } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppConfig} from '../../../../conf/app.config';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import * as L from 'leaflet'
// import { SightsMapComponent } from '../map/map.component'


@Component({
  selector: 'app-sight-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SightsFormComponent implements OnInit {
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
  program_id: any = 1;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe(params => this.program_id = params['id'])
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/` + this.program_id)
      .subscribe(result => {
        this.program = result;
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
        this.getSurveySpeciesItems(this.taxonomyList);
        console.log('TAXXLIST', this.taxonomyList);
      })
  }

  ngOnInit() {
    // TODO: programArea, layer, setview, marker
    const formMap = new L.map('formMap').setView([45.04499482319101, 5.042724609375001], 13)
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(formMap)
    console.log(formMap)
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
    this.restItemsServiceGetSurveySpeciesItems(taxlist)
        .subscribe(species => this.surveySpecies = species);
  }
}
