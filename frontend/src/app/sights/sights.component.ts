import { Component, OnInit } from '@angular/core';
import * as L from "leaflet";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

declare let $: any;

@Component({
  selector: 'app-sights',
  templateUrl: './sights.component.html',
  styleUrls: ['./sights.component.css']
})
export class SightsComponent implements OnInit {



  constructor(private modalService: NgbModal) {}


  modal(content) {
    this.modalService.open(content, {});
  }

  ngOnInit() {
       // Déclaration de la carte avec les coordonnées du centre et le niveau de zoom.
    const mysightmap = L.map('sightmap').setView([45, 5], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(mysightmap);

    const myIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png'
    });
    var myMarker = null;

    var myMarkerTitle = '<i class="fa fa-eye"></i> Partagez votre observation';
    // var myMarkerContent = 'Texte du contenu du modal';


    //
    // myMarker.on({
    //   click: function (e) {
    //     $("#feature-title").html(myMarkerTitle);
    //     // $("#feature-info").html(myMarkerContent);
    //     $("#featureModal").modal("show");
    //   }
    // });
    mysightmap.on('click', function <LeafletMouseEvent>(e) {
      //var Coords = "Lat, Lon : " + e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3);
      var Coords = JSON.stringify({ type: "Point", coordinates: [e.latlng.lng, e.latlng.lat]});
      if (myMarker !== null) {
        mysightmap.removeLayer(myMarker);
      }
      myMarker = L.marker(e.latlng, {icon: myIcon}).addTo(mysightmap);
      $("#feature-title").html(myMarkerTitle);
      $("#feature-coords").html(Coords);
      // $("#feature-info").html(myMarkerContent);
      $("#featureModal").modal("show");
    });



    //
    // var myMarkerTitle='Titre du modal';
    // var myMarkerContent='Mon contenu';

    // myMarker.on({
    //   click: function (e) {
    //     $("#feature-title").html(myMarkerTitle);
    //     $("#feature-info").html(myMarkerContent);
    //     $("#featureModal").modal("show");
    //   }
    // });
  }

}
