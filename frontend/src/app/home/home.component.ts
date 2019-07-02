import {Component, OnInit, ViewEncapsulation, AfterViewChecked, Inject, LOCALE_ID } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Meta, SafeHtml, DomSanitizer } from "@angular/platform-browser";

import { AppConfig } from "../../conf/app.config";
import { ProgramsResolve } from "../programs/programs-resolve.service";
import { Program } from "../programs/programs.models";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class HomeComponent implements OnInit, AfterViewChecked {
  programs: Program[];
  fragment: string;
  platform_teaser: SafeHtml;
  platform_intro: SafeHtml;
  AppConfig = AppConfig;
  htmlContent: SafeHtml;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private route: ActivatedRoute,
    private meta: Meta,
    protected domSanitizer: DomSanitizer,
    protected http: HttpClient
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs;
    });
    this.route.fragment.subscribe(fragment => {
      this.fragment = fragment;
    });

    this.meta.updateTag({
      name: "description",
      content:
        "GeoNature-citizen est une application de crowdsourcing des données sur la biodiversité."
    });
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
