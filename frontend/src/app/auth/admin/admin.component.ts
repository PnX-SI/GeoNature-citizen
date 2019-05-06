import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "../auth.service";

const ADMIN_ENDPOINT = AppConfig.API_ENDPOINT + "/admin/";
const PROGRAM_ENDPOINT = ADMIN_ENDPOINT + "programsmodel/";

@Component({
  selector: "app-admin",
  template: `
    <section><iframe id="admin" [src]="adminUrl"></iframe></section>
  `,
  styleUrls: ["./admin.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  adminUrl: SafeUrl;

  constructor(
    private auth: AuthService,
    private sanitizer: DomSanitizer,
    protected http: HttpClient
  ) {}

  ngOnInit() {
    this.adminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      PROGRAM_ENDPOINT + "?jwt=" + this.auth.getAccessToken()
    );
  }
}
