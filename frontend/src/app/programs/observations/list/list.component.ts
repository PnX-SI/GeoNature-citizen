import {
  Component,
  OnChanges,
  Input,
  HostListener,
  ChangeDetectorRef
} from "@angular/core";

import { AppConfig } from "../../../../conf/app.config";
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
  AppConfig = AppConfig;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges() {
    if (this.observations) {
      console.debug("ObsListComponent::observations OnChanges");
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

  @HostListener("document:NewObservationEvent", ["$event"])
  public newObservationEventHandler(e: CustomEvent) {
    const obsFeature: Feature = e.detail;
    console.debug("[ObsListComponent.newObservationEventHandler]", obsFeature);
    this.observationList = [obsFeature, ...this.observations.features];
    this.cd.detectChanges();
  }
}
