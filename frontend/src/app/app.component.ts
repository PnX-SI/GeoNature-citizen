import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Title, Meta } from '@angular/platform-browser';

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
    private metaTagService: Meta,
    private titleService: Title,
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

    this.metaTagService.addTags([
      { name: 'keywords', content: 'GeoNature-citizen ' + (this.appConfig.META.keywords ? this.appConfig.META.keywords: '') },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'collectif GeoNature' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { charset: 'UTF-8' }
    ]);
  }
}
