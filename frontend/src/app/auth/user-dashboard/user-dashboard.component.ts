import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../auth.service";
import { Observable } from "rxjs";

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
  modalRef: NgbModalRef;
  personalInfo: any = {};

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthorized(access_token)
        .then(user => {
          if (user["features"]["id_role"]) {
            this.isLoggedIn = true;
            this.username = user["features"]["username"];
          }
        })
        .catch(err => alert(err));
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
      .catch(err => alert(err));
  }

  getPersonalInfo(): Observable<any> {
    let url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers });
  }

  exportPersonalData() {
    this.getPersonalInfo().subscribe(data => {
      alert(JSON.stringify(data));
      // TODO: data format: csv, geojson ? Link observations and associated medias ?
    });
  }

  editInfos(content) {
    this.getPersonalInfo().subscribe(data => {
      this.personalInfo = data;
      this.modalRef = this.modalService.open(content, {
        size: "lg",
        centered: true
      });
    });
  }

  onUpdatePersonalData() {
    this.http
      .post(`${AppConfig.API_ENDPOINT}/user/info`, this.personalInfo, {
        headers: this.headers
      })
      .subscribe(
        data => console.debug(data),
        error => console.error(error),
        () => {
          // update PI
          this.modalRef.close();
        }
      );
  }
}
