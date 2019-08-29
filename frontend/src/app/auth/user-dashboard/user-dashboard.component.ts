import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, Subject, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../auth.service";

import { saveAs } from "file-saver";

@Component({
  selector: "app-user-dashboard",
  templateUrl: "./user-dashboard.component.html",
  styleUrls: ["./user-dashboard.component.css"]
})
export class UserDashboardComponent implements OnInit {
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });
  readonly AppConfig = AppConfig;
  modalRef: NgbModalRef;
  username: string = "not defined";
  role_id: number;
  isLoggedIn: boolean = false;
  stats: any;
  personalInfo: any = {};
  badges: any;
  main_badges: any = [];
  programs_badges: any = [];
  recognition_badges: any = [];

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    console.debug("dashboard", access_token);
    if (access_token) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            console.debug("user:", user);
            if (user && user["features"] && user["features"]["id_role"]) {
              this.isLoggedIn = true;
              this.username = user["features"]["username"];
              this.stats = user["features"]["stats"];
              this.role_id = user["features"]["id_role"];
              // FIXME: source backend conf
              if (AppConfig["REWARDS"]) {
                this.getBadgeCategories();
              }
            }
          }),
          catchError(err => throwError(err))
        )
        .subscribe();
    }
  }

  deletePersonalData() {
    const access_token = localStorage.getItem("access_token");
    this.auth
      .selfDeleteAccount(access_token)
      .then(data => {
        let getBackHome = confirm(
          data.hasOwnProperty("message")
            ? `${data.message}\nRevenir à l'accueil ?`
            : data
        );
        if (getBackHome) {
          this.router.navigate(["/home"]);
        }
      })
      .catch(err => console.log("err", err));
  }

  getPersonalInfo(): Observable<any> {
    let url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers });
  }

  exportPersonalData() {
    this.getPersonalInfo().subscribe(data => {
      let blob = new Blob([JSON.stringify(data)], {
        type: "text/plain;charset=utf-8"
      });
      saveAs(blob, "mydata.txt");
      //alert(JSON.stringify(data));
      // TODO: data format: csv, geojson ? Link observations and associated medias ?
    });
  }

  editInfos(content): void {
    this.getPersonalInfo().subscribe(data => {
      this.personalInfo = data;
      this.modalRef = this.modalService.open(content, {
        size: "lg",
        centered: true
      });
    });
  }

  onUpdatePersonalData(): void | Error {
    this.http
      .post(`${AppConfig.API_ENDPOINT}/user/info`, this.personalInfo, {
        headers: this.headers
      })
      .pipe(
        catchError(error => {
          //window.alert(error);
          return throwError(error);
        })
      )
      .subscribe(() => {
        this.modalRef.close();
      });
  }

  getBadgeCategories() {
    this.http
      .get<Object>(`${AppConfig.API_ENDPOINT}/rewards/${this.role_id}`)
      .subscribe(
        rewards => {
          this.badges = rewards;
          localStorage.setItem("badges", JSON.stringify(this.badges));
          this.badges.forEach(badge => {
            if (badge.type == "all_attendance" || badge.type == "seniority")
              this.main_badges.push(badge);
            if (badge.type == "program_attendance")
              this.programs_badges.push(badge);
            if (badge.type == "recognition")
              this.recognition_badges.push(badge);
          });
        },
        err => {
          throwError(err);
        }
      );
  }
}
