import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';

import * as L from 'leaflet'

import { AppConfig } from '../../../../conf/app.config';

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10
export const obsFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue.png",  // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
})
export const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation'


@Component({
  selector: 'app-obs-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ObsFormComponent implements AfterViewInit {
  coords: any;
  obsForm = new FormGroup({
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
  program_id: any;
  formMap: any

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

        // TODO: extract programArea centroid
        const formMap = L.map('formMap').setView([45.04499482319101, 5.042724609375001], 13)
        /*
         const formMap = L.map('formMap').locate({setView: true, maxZoom: 13})
        function onLocationFound(e) {
          const radius = e.accuracy / 2;
          L.marker(e.latlng).addTo(map)
              .bindPopup("You are within " + radius + " meters from this point").openPopup();

          L.circle(e.latlng, radius).addTo(map);
        }
        formMap.on('locationfound', onLocationFound);
        */

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

        const maxBounds = programArea.getBounds()
        formMap.fitBounds(maxBounds)
        // QUESTION: enforce program area maxBounds (optional ?)
        // formMap.setMaxBounds(maxBounds)

        let myMarker = null;

        formMap.on("click", function(e) {
          //var Coords = "Lat, Lon : " + e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3);
          let coords = JSON.stringify({
            type: "Point",
            coordinates: [e.latlng.lng, e.latlng.lat]
          });
          // this.coords = coords;
          console.log(coords);

          if (myMarker !== null) {
            formMap.removeLayer(myMarker);
          }

          // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
          // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
          if (L.latLngBounds(maxBounds).contains([e.latlng.lat, e.latlng.lng])) {
            myMarker = L.marker(e.latlng, { icon: obsFormMarkerIcon }).addTo(formMap);
            $("#feature-title").html(myMarkerTitle);
            $("#feature-coords").html(coords);
            // $("#feature-info").html(myMarkerContent);
            $("#featureModal").modal("show");
          /* } else {
              console.debug(maxBounds, [e.latlng.lat, e.latlng.lng])
          */
          }
        });
      })
  }

  onFormSubmit(): void {
    console.log('obsForm: ', this.obsForm);
    console.log('formValues:' + this.obsForm.value);
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
