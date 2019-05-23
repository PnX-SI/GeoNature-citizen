import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../auth.service";
import { Observable, Subject, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";

// const groupBy = (items, key) =>
//   items.reduce(
//     (result, item) => ({
//       ...result,
//       [item[key]]: [...(result[item[key]] || []), item]
//     }),
//     {}
//   );

@Component({
  selector: "app-user-dashboard",
  templateUrl: "./user-dashboard.component.html",
  styleUrls: ["./user-dashboard.component.css"]
})
export class UserDashboardComponent implements OnInit {
  readonly AppConfig = AppConfig;
  isLoggedIn: boolean = false;
  username: string = "not defined";
  stats: any;
  role_id: number;
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });
  modalRef: NgbModalRef;
  personalInfo: any = {};
  badges = [];
  badges$: Subject<Object> = new Subject<Object>();

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
            this.stats = user["features"]["stats"];
            this.role_id = user["features"]["role_id"];
            this.getBadgeCategories().subscribe(() =>
              console.debug("badges done.")
            );
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
          window.alert(error);
          return throwError(error);
        })
      )
      .subscribe(() => {
        this.modalRef.close();
      });
  }

  getBadgeCategories(): Observable<Object | Error> {
    return this.http.get<Object>(`${AppConfig.API_ENDPOINT}/dev_rewards`).pipe(
      tap(data => {
        const categories = data["badges"].reduce((cat, item) => {
          const category = item["alt"].split(/\.[^/.]+$/)[0];
          if (!cat[category]) {
            cat[category] = data["badges"].filter(item =>
              item.alt.startsWith(category + ".")
            );
          }
          return cat;
        }, {});
        // console.debug(categories);

        Object.values(categories).map(value => this.badges.push(value));
        this.badges$.next(this.badges);
        localStorage.setItem("badges", JSON.stringify(data["badges"]));
      }),
      catchError(error => {
        window.alert(error);
        return throwError(error);
      })
    );
  }
}
