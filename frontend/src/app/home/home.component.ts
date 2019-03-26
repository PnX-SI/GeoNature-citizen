import {
  Component,
  OnInit,
  ViewEncapsulation,
  AfterViewChecked
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Meta, SafeHtml } from "@angular/platform-browser";

import { AppConfig } from '../../conf/app.config'
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

  platform_teaser: SafeHtml = AppConfig.platform_teaser
  platform_intro: SafeHtml = AppConfig.platform_intro

  constructor(private route: ActivatedRoute, private meta: Meta) {}

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
        "Géonature-citizen est une application de crowdsourcing des données sur la biodiversité."
    });
  }

  ngAfterViewChecked(): void {
    try {
      if (this.fragment) {
        document.querySelector("#" + this.fragment).scrollIntoView({
          behavior: "smooth"
        });
      }
    } catch (e) {
      alert(e);
    }
  }
}
