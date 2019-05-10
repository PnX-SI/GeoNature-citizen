import {
  Component,
  OnChanges,
  Input,
  HostListener,
  ChangeDetectorRef,
  SimpleChanges,
  Output,
  EventEmitter
} from "@angular/core";
import { Observable, from, ReplaySubject } from "rxjs";

import { FeatureCollection, Feature, Geometry } from "geojson";

import { AppConfig } from "../../../../conf/app.config";
import {
  TaxonomyList,
  TaxonomyListItem,
  ObservationFeature
} from "../observation.model";

@Component({
  selector: "app-obs-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ObsListComponent implements OnChanges {
  @Input("observations") observations: FeatureCollection;
  @Input("taxa") surveySpecies: TaxonomyList;
  @Output("obsSelect") obsSelect: EventEmitter<Feature> = new EventEmitter();
  municipalities: any[];
  observationList: Feature[] = [];
  obsCount$: ReplaySubject<Feature[]>;
  program_id: number;
  taxa: any[];
  AppConfig = AppConfig;

  selectedTaxon: TaxonomyListItem = null;
  selectedMunicipality: any = null;

  constructor(private cd: ChangeDetectorRef) {
    this.obsCount$ = new ReplaySubject<Feature[]>(this.observationList);
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.observations) {
      console.debug("ObsListComponent::observations OnChanges");
      this.observationList = this.observations["features"];
      this.obsCount$.next(this.observationList);
      this.municipalities = this.observations.features
        .map(features => features.properties)
        .map(property => property.municipality)
        .filter(municipality => {
          return municipality.name && municipality.code;
        })
        .filter((v, _i, a) => {
          let exists = a.find(exist => {
            return exist.code == v.code;
          });
          return !exists || a.indexOf(exists) == a.indexOf(v);
        });
    }
  }

  @HostListener("document:NewObservationEvent", ["$event"])
  public newObservationEventHandler(e: CustomEvent) {
    const obsFeature: Feature = e.detail;
    console.debug("[ObsListComponent.newObservationEventHandler]", obsFeature);
    this.observationList = [obsFeature, ...this.observations.features];
    this.cd.detectChanges();
  }

  onFilterChange(): void {
    let filters: { taxon: string; municipality: string } = {
      taxon: null,
      municipality: null
    };
    this.observationList = this.observations["features"].filter(obs => {
      let results: boolean[] = [];
      if (this.selectedMunicipality) {
        results.push(
          obs.properties.municipality.code == this.selectedMunicipality.code
        );
        filters.municipality = this.selectedMunicipality.code;
      }
      if (this.selectedTaxon) {
        results.push(
          obs.properties.cd_nom == this.selectedTaxon.taxref["cd_nom"]
        );
        filters.taxon = this.selectedTaxon.taxref["cd_nom"];
      }
      return results.indexOf(false) < 0;
    });
    this.obsCount$.next(this.observationList);

    if (filters.taxon || filters.municipality) {
      const event: CustomEvent = new CustomEvent("ObservationFilterEvent", {
        bubbles: true,
        cancelable: true,
        detail: filters
      });
      document.dispatchEvent(event);
    }
  }

  onObsClick(e): void {
    this.obsSelect.emit(e);
  }

  trackByObs(index: number, obs: ObservationFeature): number {
    return obs.properties.id_observation;
  }
}
