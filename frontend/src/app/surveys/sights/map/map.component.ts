import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import * as L from 'leaflet';
import {map} from 'rxjs/operators';
import {AppConfig} from '../../../../conf/app.config';
import { ThrowStmt } from '@angular/compiler';

declare let $: any;

@Component({
  selector: 'app-sight-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class SightsMapComponent implements OnInit {
  sightsGeoJson: any;
  portalAreaGeoJson: any;
  coords: any;
  survey_id: any;
  mysightmap: any;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'];
    });
  }


  ngOnInit() {
    this.initMap();
    this.getSightsItems();
    this.getPortalArea();
  };


  getSightsItems(): void {
    this.restItemsServiceGetSightsItems().subscribe(sights => {
      this.sightsGeoJson = sights;

      const geoSights = this.sightsGeoJson;

    const mysightmap = this.mysightmap;

    const geojsonMarkerOptions = {
      radius: 5,
      fillColor: '#1779ba',
      color: '#ccc',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    function onEachFeature(feature, layer) {
      let popupContent = "<b>" 
      + feature.properties.common_name 
      + "</b> (<i>"
      + feature.properties.sci_name
      +"</i>)</br>le " + feature.properties.date;
      if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
      }
      layer.bindPopup(popupContent);
    }

    function pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, geojsonMarkerOptions);
    }

    console.log('SIGHTS :', geoSights);
    L.geoJSON(geoSights,
      {
        onEachFeature: onEachFeature,
        pointToLayer: pointToLayer
      }).addTo(mysightmap);
    });
  }

  getPortalArea(): void {
    this.restItemsServiceGetPortalArea().subscribe(portalarea => {
    this.portalAreaGeoJson = portalarea;
    const mysightmap = this.mysightmap;
    const portalArea = this.portalAreaGeoJsonw
    L.geoJSON(portalArea).addTo(mysightmap);
    });
  }

  initMap() {
    const mysightmap = L.map('sightmap').setView([45, 5], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(mysightmap);

    const markerIcon = L.icon({
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png'
    });

    let myMarker = null;

    const myMarkerTitle =
      '<i class="fa fa-eye"></i> Partagez votre observation';

    mysightmap.on('click', function <LeafletMouseEvent>(e) {
      //var Coords = "Lat, Lon : " + e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3);
      let coords = JSON.stringify({
        type: 'Point',
        coordinates: [e.latlng.lng, e.latlng.lat]
      });
      this.coords = coords;
      console.log(coords);
      if (myMarker !== null) {
        mysightmap.removeLayer(myMarker);
      }
      myMarker = L.marker(e.latlng, {icon: markerIcon}).addTo(mysightmap);
      $('#feature-title').html(myMarkerTitle);
      $('#feature-coords').html(coords);
      // $("#feature-info").html(myMarkerContent);
      $('#featureModal').modal('show');
    });

    this.mysightmap = mysightmap;

  }

  restItemsServiceGetSightsItems() {
    return this.http.get(`${AppConfig.API_ENDPOINT}/sights`).pipe(map(data => data));
  }

  restItemsServiceGetPortalArea() {
    return this.http.get(`${AppConfig.API_ENDPOINT}/portalarea`).pipe(map(data => data));
  }
}
