import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
// import { Meta } from '@angular/platform-browser';

import { ProgramsResolve } from "../programs/programs-resolve.service";
import { Program } from "../programs/programs.models";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [ProgramsResolve]
})
export class HomeComponent implements OnInit {
  programs: Program[];

  constructor(
    private route: ActivatedRoute,
    // private meta: Meta,
    protected domSanitizer: DomSanitizer // TODO: mv to program service
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data: { programs: Program[] }) => {
      this.programs = data.programs.map(p => {
        p.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(
          p.short_desc
        );
        p.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(
          p.long_desc
        );
        return p;
      });
    });
    // this.meta.updateTag({
    //    name: 'description',
    //    content: '...my description'
    //  });
  }
}
