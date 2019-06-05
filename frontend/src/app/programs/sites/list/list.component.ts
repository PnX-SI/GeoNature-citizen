import {
  Component,
  OnChanges,
  Input,
  EventEmitter,
  Output
} from "@angular/core";

import { FeatureCollection, Feature } from "geojson";
import { SiteModalFlowService } from "../modalflow/modalflow.service";
import {AppConfig} from "../../../../conf/app.config";

@Component({
  selector: "app-sites-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class SitesListComponent implements OnChanges {
  @Input("sites") sitesCollection: FeatureCollection;
  @Input("taxa") surveySpecies: any[];
  @Input("program_id") program_id: number;
  @Output("siteSelect") siteSelect: EventEmitter<Feature> = new EventEmitter();
  municipalities: string[];
  sites: Feature[] = [];
  taxa: any[];
  apiEndpoint = AppConfig.API_ENDPOINT;

  constructor(public flowService: SiteModalFlowService) {}

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
  addSiteVisit(site_id) {
    this.flowService.addSiteVisit(site_id);
  }

  onSiteClick(e): void {
    this.siteSelect.emit(e);
  }
}
