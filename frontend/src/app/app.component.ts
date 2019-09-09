import { Component, OnInit, ViewEncapsulation } from "@angular/core";

import { AppConfig } from "../conf/app.config";
import { Router, NavigationStart } from "@angular/router";
import { ModalsTopbarService } from "./core/topbar/modalTopbar.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = "GeoNature-citizen";
  public appConfig: any;

  constructor(
    private router: Router,
    private modalService: ModalsTopbarService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.modalService.close()
      }
    });
  }

  ngOnInit() {
    this.appConfig = AppConfig;
  }
}
