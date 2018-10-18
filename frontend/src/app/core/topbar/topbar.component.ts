import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../../conf/app.config";
import { stringify } from "@angular/core/src/util";

@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.css"]
})
export class TopbarComponent implements OnInit {
  title: string = AppConfig.appName;
  constructor() {
  }

  ngOnInit() {}
}
