import { Component, OnInit, ViewEncapsulation, Inject, LOCALE_ID } from "@angular/core";
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
  public backgroundImage: any;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
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
    this.backgroundImage = AppConfig.API_ENDPOINT + "/media/background.jpg";
    this.metaTagService.addTags([
      { name: 'keywords', content: 'GeoNature-citizen ' + (this.appConfig.META.keywords ? this.appConfig.META.keywords: '') },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'collectif GeoNature' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { charset: 'UTF-8' },
      { property: 'og:title', content: AppConfig.appName },
      { property: 'og:description', content: AppConfig.platform_teaser[this.localeId] },
      { property: 'og:image', content: this.backgroundImage },
      { property: 'og:url', content: AppConfig.URL_APPLICATION },
      { property: 'twitter:title', content: AppConfig.appName },
      { property: 'twitter:description', content: AppConfig.platform_teaser[this.localeId] },
      { property: 'twitter:image', content: this.backgroundImage }
    ]);
  }
}
