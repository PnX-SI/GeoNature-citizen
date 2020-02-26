import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppConfig } from "../../conf/app.config";
import {Title, Meta} from "@angular/platform-browser";

@Component({
  selector: "app-about",
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.css"]
})
export class AboutComponent implements OnInit {
  constructor(private router: Router, private titleService: Title) {}

  ngOnInit() {
    if (!AppConfig.about) {
      this.router.navigateByUrl("home");
    }
    this.titleService.setTitle(AppConfig.appName + ' - '+'A propos')
  }
}
