import { Component, OnChanges, Input } from "@angular/core";

import { FeatureCollection, Feature } from "geojson";
import { TaxonomyList } from "../observation.model";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnChanges {
  @Input("observations") observations: FeatureCollection;
  @Input("taxa") surveySpecies: TaxonomyList;
  municipalities: string[];
  observationList: Feature[] = [];
  program_id: number;
  taxa: any[];

  ngOnChanges() {
    if (this.observations) {
      this.observationList = this.observations["features"];
      this.municipalities = this.observations.features
        .map(features => features.properties)
        .map(property => property.municipality)
        .filter(municipality =>
          municipality != null ? <string>municipality : ""
        )
        .filter((v, i, a) => a.indexOf(v) === i);
    }
  }
}
