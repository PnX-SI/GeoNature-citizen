import { Component, OnInit } from "@angular/core";
import { Observable, Subject, throwError } from "rxjs";
import { tap, map, catchError } from "rxjs/operators";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../../auth/auth.service";
import { LoginComponent } from "../../auth/login/login.component";
import { LogoutComponent } from "../../auth/logout/logout.component";
import { RegisterComponent } from "../../auth/register/register.component";
import { ProgramsComponent } from "../../programs/programs.component";
import { Program } from "../../programs/programs.models";
import { GncProgramsService } from "../../api/gnc-programs.service";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.css"]
})
export class TopbarComponent implements OnInit {
  title: string = AppConfig.appName;
  // isLoggedIn: boolean = false;
  username: any;
  modalRef: NgbModalRef;
  programs$ = new Subject<Program[]>();
  isAdmin = false;
  canDisplayAbout: boolean = AppConfig.about;
  adminUrl: SafeUrl;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    private auth: AuthService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    protected http: HttpClient
  ) {
    const tmp = localStorage.getItem("username");
    this.username = tmp ? tmp.replace(/\"/g, "") : "Anonymous";
    this.route.data
      .pipe(
        tap((data: { programs: Program[] }) => {
          if (data && data.programs) {
            this.programs$.next(data.programs);
          } else {
            // console.warn("topbar::getAllPrograms");
            this.programService.getAllPrograms().subscribe(programs => {
              this.programs$.next(programs);
            });
          }
        }),
        catchError(error => throwError(error))
      )
      .subscribe();
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth.authorized$.pipe(
      map(value => {
        if (value === true) {
          this.username = localStorage.getItem("username");
        }
        return value;
      })
    );
  }


  login() {
    this.modalRef = this.modalService.open(LoginComponent, {
      size: "lg",
      centered: true
    });
  }

  register() {
    this.modalRef = this.modalService.open(RegisterComponent, {
      size: "lg",
      centered: true
    });
  }

  logout() {
    this.modalRef = this.modalService.open(LogoutComponent, {
      size: "lg",
      centered: true
    });
  }

  programs() {
    this.modalRef = this.modalService.open(ProgramsComponent, {
      size: "lg",
      centered: true
    });
  }

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    console.log("topabr ngOnInit", access_token);
    if (access_token) {
      this.auth.ensureAuthorized().subscribe(
        user => {
          console.log("ensureAuthorized result", user);
          if (user && user["features"] && user["features"].id_role) {
            this.username = user["features"].username;
            this.isAdmin = user["features"].admin ? true : false;
            if (this.isAdmin) {
              const ADMIN_ENDPOINT = [
                AppConfig.API_ENDPOINT,
                // this.localeId,
                "admin",
                ""
              ].join("/");
              const PROGRAM_ENDPOINT = ADMIN_ENDPOINT + "programsmodel/";
              this.adminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                PROGRAM_ENDPOINT + "?jwt=" + this.auth.getAccessToken()
              );
            }
          }
        },
        err => {
          console.error(err);
          this.auth
            .logout()
            .then(logout => {
              console.log("Logout Status:", logout.status);
            })
            .catch(err => {
              console.error("Logout error:", err);
            });
          return throwError(err);
        }
      );
      /*this.auth.ensureAuthorized().pipe(
        tap(user => {
          console.log("ensureAuthorized result", user);
          if (user && user["features"] && user["features"].id_role) {
            this.username = user["features"].username;
            this.isAdmin = user["features"].admin ? true : false;
          }
        }),
        catchError(err => {
          console.error(err);
          this.auth
            .logout()
            .then(logout => {
              console.log("Logout Status:", logout.status);
            })
            .catch(err => {
              console.error("Logout error:", err);
            });
          return throwError(err);
        })
      );*/
    }
  }

  close(d) {
    this.modalRef.close(d);
  }
}
