import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild
} from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeUrl, SafeHtml } from "@angular/platform-browser";
import { Observable } from "rxjs";
import { tap, map, share, takeWhile } from "rxjs/operators";

import { AppConfig } from "../../../conf/app.config";

const ADMIN_ENDPOINT = AppConfig.API_ENDPOINT + "/admin/";
const PROGRAM_ENDPOINT = ADMIN_ENDPOINT + "programsmodel/";

@Component({
  selector: "app-admin",
  // <section><iframe id="admin" [src]="trustedUrl"></iframe></section>
  template: `
    <section [innerHTML]="trustedContent"></section>
    <section><iframe id="section3" #section3></iframe></section>
  `,
  styleUrls: ["./admin.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  @ViewChild("section3") blobDisplay: ElementRef;
  routeParams: Observable<ParamMap>;
  trustedUrl: SafeUrl;
  trustedContent: SafeHtml;
  private alive = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
    protected http: HttpClient
  ) {
    this.routeParams = this.activatedRoute.paramMap.pipe(
      takeWhile(() => this.alive),
      tap(params => console.debug(params)),
      share()
    );
  }

  ngOnDestroy() {
    this.alive = false;
  }

  ngOnInit() {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      PROGRAM_ENDPOINT
    );

    this.http
      .get(PROGRAM_ENDPOINT, {
        responseType: "blob"
      })
      .subscribe(
        blob =>
          (this.blobDisplay.nativeElement.src = URL.createObjectURL(blob)),
        err => (this.trustedContent = err)
      );
  }
}
