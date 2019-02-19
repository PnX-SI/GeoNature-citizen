import { Component, OnChanges, Input } from "@angular/core";

import { FeatureCollection, Feature } from "geojson";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnChanges {
  @Input("observations") obs: FeatureCollection;
  @Input("taxa") surveySpecies: any[];
  municipalities: string[];
  observations: Feature[] = [];
  program_id: number;
  taxa: any[];

  ngOnChanges() {
    if (this.obs) {
      this.observations = this.obs["features"];
      this.municipalities = this.obs.features
        .map(features => features.properties)
        .map(property => property.municipality)
        .filter(municipality =>
          municipality != null ? <string>municipality : ""
        )
        .filter((v, i, a) => a.indexOf(v) === i);
    }
  }
}
