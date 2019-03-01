import { Component, OnInit } from "@angular/core";
import { AuthService } from "./../auth.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { AppConfig } from "../../../conf/app.config";
import { Router } from "@angular/router";

@Component({
  selector: "app-user-dashboard",
  templateUrl: "./user-dashboard.component.html",
  styleUrls: ["./user-dashboard.component.css"]
})
export class UserDashboardComponent implements OnInit {
  isLoggedIn: boolean = false;
  username: string = "not defined";
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthenticated(access_token)
        .then(user => {
          console.debug(user["features"]["username"]);
          if (user["features"]["id_role"]) {
            this.isLoggedIn = true;
            this.username = user["features"]["username"];
          }
        })
        .catch(err => console.log(err));
    }
  }

  deletePersonalData() {
    const access_token = localStorage.getItem("access_token");
    this.auth
      .selfDeleteAccount(access_token)
      .then(data => {
        console.debug(data);
        let getBackHome = confirm(
          data.hasOwnProperty("message")
            ? `${data.message}\nRevenir à l'accueil ?`
            : data
        );
        if (getBackHome) {
          this.router.navigate(["/home"]);
        }
      })
      .catch(err => console.error(err));
  }

  exportPersonalData() {
    let url = `${AppConfig.API_ENDPOINT}/user/info`;
    const data = this.http.get(url, { headers: this.headers });
    data.subscribe(data => {
      console.debug(data);
      alert(JSON.stringify(data));
      // TODO: need decision over data format: csv, geojson ? Link observations and associated medias ?
    });
  }
}
