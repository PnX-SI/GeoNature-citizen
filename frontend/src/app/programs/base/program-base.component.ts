import {
  Component,
  AfterViewInit
} from "@angular/core";
import { FeatureCollection, Feature } from "geojson";
import { Program } from "../programs.models";
import * as L from "leaflet";
import { AppConfig } from "../../../conf/app.config";


export abstract class ProgramBaseComponent implements AfterViewInit {
  AppConfig = AppConfig;
  fragment: string;
  coords: L.Point;
  program_id: any;
  programs: Program[];
  program: Program;
  programFeature: FeatureCollection;
  abstract flowService: any;

  ngAfterViewInit(): void {
    try {
      if (this.fragment) {
        document
          .querySelector("#" + this.fragment)
          .scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      //alert(e);
    }
  }

  ngOnDestroy(): void {
    this.flowService.closeModal();
  }

  onMapClicked(p: L.Point): void {
    this.coords = p;
    console.debug("map clicked", this.coords);
  }
}
