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
  // programs$: Observable<Program[]>;
  programs$ = new Subject<Program[]>();
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private programService: GncProgramsService,
    private auth: AuthService,
    private modalService: NgbModal
  ) {
    const tmp = localStorage.getItem("username");
    this.username = tmp ? tmp.replace(/\"/g, "") : "Anonymous";
    // this.programs$ = this.programService.getAllPrograms();
    this.route.data
      .pipe(
        tap((data: { programs: Program[] }) => {
          if (data.programs) {
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
      .subscribe(data => {
        // HELP: triggers "EmptyError: no elements in sequence" right after our token refresh
        // console.debug("topbar::programs", data);
      });
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
    if (access_token) {
      this.auth
        .ensureAuthorized(access_token)
        .then(user => {
          if (user && user.features) {
            if (user.features.id_role) {
              this.username = user.features.username;
              this.isAdmin = user.features.admin ? true : false;
            }
          }
        })
        .catch(err => {
          console.log(err);
          this.auth
            .logout()
            .then(logout => {
              console.log("LogoutUser Get Status", logout.status);
            })
            .catch(err => {
              console.log(err);
            });
        });
    }
  }

  close(d) {
    this.modalRef.close(d);
  }
}
