import { Component, OnInit, ViewEncapsulation } from "@angular/core";

import { AppConfig } from "../conf/app.config";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = "GeoNature-citizen";
  public appConfig: any;

  ngOnInit() {
    this.appConfig = AppConfig;
  }
}
