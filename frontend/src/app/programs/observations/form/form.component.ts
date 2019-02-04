import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';

import * as L from 'leaflet'

import { AppConfig } from '../../../../conf/app.config';

declare let $: any;

export const obsFormMarkerIcon = L.icon({
    iconUrl:
      "//cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png",
    iconSize: [25, 40],
    iconAnchor: [12, 40]
  })

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
    date: new FormControl('', Validators.required),
    file: new FormControl(),
    taxon: new FormControl(),
    // coord,
  });
  surveySpecies: any;
  taxonomyList: any;
  program: any;
  program_id: any = 1;
  formMap: any
  taxonListThreshold = 10

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute) {
  }

  ngAfterViewInit() {
    this.route.params.subscribe(params => this.program_id = params['id'])
    this.http
      .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
      .subscribe(result => {
        this.program = result;
        console.debug('Program', this.program)
        this.taxonomyList = this.program.features[0].properties.taxonomy_list;
        this.getSurveySpeciesItems(this.taxonomyList);
        console.log('TaxonomyList', this.taxonomyList);

        // TODO: constraints to keep program perimeter inbound (chckbx?)
        const formMap = L.map('formMap').setView([45.04499482319101, 5.042724609375001], 13)

        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap'
        }).addTo(formMap)

        const programArea = L.geoJSON(this.program, {
          style: function(_feature) {
            return {
              fillColor: "transparent",
              weight: 2,
              opacity: 0.8,
              color: "red",
              dashArray: "4"
            };
          }
        }).addTo(formMap)  // .bindPopup("Observation");
        formMap.fitBounds(programArea.getBounds())

        let myMarker = null;

        const myMarkerTitle =
          '<i class="fa fa-eye"></i> Partagez votre observation';

        formMap.on("click", function(e) {
          //var Coords = "Lat, Lon : " + e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3);
          let coords = JSON.stringify({
            type: "Point",
            coordinates: [e.latlng.lng, e.latlng.lat]
          });
          this.coords = coords;
          console.log(coords);
          if (myMarker !== null) {
            formMap.removeLayer(myMarker);
          }
          myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(formMap);
          $("#feature-title").html(myMarkerTitle);
          $("#feature-coords").html(coords);
          // $("#feature-info").html(myMarkerContent);
          $("#featureModal").modal("show");
        });
      })
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
      .get(`${AppConfig.API_ENDPOINT}/taxonomy/lists/${taxlist}/species`)
      .pipe(map(data => data));
  }

  getSurveySpeciesItems(taxlist): void {
    this.restItemsServiceGetSurveySpeciesItems(taxlist)
        .subscribe(species => this.surveySpecies = species);
  }
}
