import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppConfig} from '../../../../conf/app.config';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import * as L from 'leaflet'


declare let $: any;

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
  taxonListThreshold = 10  // TODO: export to conf

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute) {
  }

  ngAfterViewInit() {
    this.route.params.subscribe(params => this.program_id = params['id'] || 1)
    this.http
    .get(`${AppConfig.API_ENDPOINT}/programs/${this.program_id}`)
    .subscribe(result => {
      this.program = result;
      console.debug('affcted program', this.program)
      this.taxonomyList = this.program.features[0].properties.taxonomy_list;
      this.getSurveySpeciesItems(this.taxonomyList);
      console.log('TAXXLIST', this.taxonomyList);

      const formMap = L.map('formMap').setView([45.04499482319101, 5.042724609375001], 13)
      // TODO: extract programArea centroid
      /*
       const formMap = L.map('formMap').locate({setView: true, maxZoom: 13})
      function onLocationFound(e) {
        const radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();

        L.circle(e.latlng, radius).addTo(map);
      }
      map.on('locationfound', onLocationFound);
      */

      L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: 'OpenStreetMap'
      }).addTo(formMap)

      const markerIcon = L.icon({
          iconUrl:
          "../../../../assets/pointer-blue.png",  // TODO: Asset path should be normalized, conf ?
          iconAnchor: [16, 42]
        })

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
      }).addTo(formMap)

      const maxBounds = programArea.getBounds()
      formMap.fitBounds(maxBounds)
      // enforce program area maxBounds (optional ?)
      // formMap.setMaxBounds(maxBounds)

      let myMarker = null;
      const myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation';

      console.debug('prog:', this.program)

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

        // TODO: enforce program area -> concave polygon: see ray casting algorithm.
        // inspiration: https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
        if (L.latLngBounds(maxBounds).contains([e.latlng.lat, e.latlng.lng])) {
          myMarker = L.marker(e.latlng, { icon: markerIcon }).addTo(formMap);
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
