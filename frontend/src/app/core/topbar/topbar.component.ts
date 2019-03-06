import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../../auth/auth.service";
import { LoginComponent } from "../../auth/login/login.component";
import { LogoutComponent } from "../../auth/logout/logout.component";
import { RegisterComponent } from "../../auth/register/register.component";
import { ProgramsComponent } from "../../programs/programs.component";

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

  constructor(private auth: AuthService, private modalService: NgbModal) {
    const tmp = localStorage.getItem("username");
    this.username = tmp ? tmp.replace(/\"/g, "") : "Anonymous";
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth.authorized$.pipe(
      map(value => {
        if (value === true) {
          this.username = localStorage.getItem("username").replace(/\"/g, "");
        }
        return value;
      })
    );
  }

  get userLoggedIn() {
    if (localStorage.getItem("username")) {
      this.username = localStorage.getItem("username").replace(/\"/g, "");
      return true;
    }
    return false;
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
          if (user.id_role) {
            // this.isLoggedIn = true;
            this.username = user.username;
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
