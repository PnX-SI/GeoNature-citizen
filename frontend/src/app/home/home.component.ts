import { Component, OnInit, AfterViewChecked, Inject, LOCALE_ID } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Title, Meta, SafeHtml, DomSanitizer } from "@angular/platform-browser";
import {Router} from "@angular/router";
import { AppConfig } from "../../conf/app.config";
import { ProgramsResolve } from "../programs/programs-resolve.service";
import { Program } from "../programs/programs.models";
import { ObservationsService } from "../programs/observations/observations.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  providers: [ProgramsResolve]
})
export class HomeComponent implements OnInit, AfterViewChecked {
  programs: Program[];
  fragment: string;
  platform_teaser: SafeHtml;
  platform_intro: SafeHtml;
  AppConfig = AppConfig;
  htmlContent: SafeHtml;
  stats: Object;
  backgroundImage: any;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private router: Router,
    private route: ActivatedRoute,
    private metaTagService: Meta,
    private titleService: Title,
    private observationsService: ObservationsService,
    protected domSanitizer: DomSanitizer,
    protected http: HttpClient
  ) { }

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
      this.observationsService.getStat().subscribe(
        (stats) => this.stats = stats
      )
    });
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });


    this.backgroundImage = AppConfig.API_ENDPOINT + "/media/background.jpg";
    this.metaTagService.updateTag({
      name: "description",
      content:
        this.AppConfig.platform_teaser.fr
    });
    this.metaTagService.updateTag({ property: 'og:title', content: AppConfig.appName });
    this.metaTagService.updateTag({ property: 'og:description', content: AppConfig.platform_teaser[this.localeId] });
    this.metaTagService.updateTag({ property: 'og:image', content: this.backgroundImage });
    this.metaTagService.updateTag({ property: 'og:url', content: AppConfig.URL_APPLICATION+this.router.url });
    this.metaTagService.updateTag({ property: 'twitter:title', content: AppConfig.appName });
    this.metaTagService.updateTag({ property: 'twitter:description', content: AppConfig.platform_teaser[this.localeId] });
    this.metaTagService.updateTag({ property: 'twitter:image', content: this.backgroundImage });
    this.titleService.setTitle(this.AppConfig.appName);
    this.platform_intro = this.domSanitizer.bypassSecurityTrustHtml(
      AppConfig["platform_intro"][this.localeId]
    );
    this.platform_teaser = this.domSanitizer.bypassSecurityTrustHtml(
      AppConfig["platform_teaser"][this.localeId]
    );
  }

  ngAfterViewChecked(): void {
    try {
      if (this.fragment) {
        document.querySelector("#" + this.fragment).scrollIntoView({
          behavior: "smooth"
        });
      }
    } catch (e) {
      //alert(e);
    }
  }
}
