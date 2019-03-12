import { Component, OnChanges, Input } from "@angular/core";

import { FeatureCollection, Feature } from "geojson";

@Component({
  selector: "app-sites-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class SitesListComponent implements OnChanges {
  @Input("sites") sitesCollection: FeatureCollection;
  @Input("taxa") surveySpecies: any[];
  municipalities: string[];
  sites: Feature[] = [];
  program_id: number;
  taxa: any[];

  ngOnChanges() {
    if (this.sitesCollection) {
      this.sites = this.sitesCollection["features"];
      this.municipalities = this.sitesCollection.features
        .map(features => features.properties)
        .map(property => property.municipality)
        .filter(municipality =>
          municipality != null ? <string>municipality : ""
        )
        .filter((v, i, a) => a.indexOf(v) === i);
    }
  }
}
