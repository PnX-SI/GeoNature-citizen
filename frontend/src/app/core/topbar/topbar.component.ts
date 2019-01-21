import { AuthService } from "./../../auth/auth.service";
import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../../conf/app.config";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoginComponent } from "../../auth/login/login.component";
import { RegisterComponent } from "../../auth/register/register.component";
import { LogoutComponent } from "../../auth/logout/logout.component";
import { ProgramsComponent } from "../../programs/programs.component";


@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.css"]
})
export class TopbarComponent implements OnInit {
  title: string = AppConfig.appName;
  isLoggedIn: boolean = false;
  username: any;

  constructor(private auth: AuthService, private modalService: NgbModal) {}

  // modal(content) {
  //   this.modalService.open(content, {size: 'lg',centered:true});
  // }

  get userLoggedIn() {
    if (localStorage.getItem("username")) {
      this.username = localStorage.getItem("username").replace(/\"/g, "");
      return true;
    }
    return false;
  }

  login() {
    this.modalService.open(LoginComponent, { size: "lg", centered: true });
  }

  register() {
    this.modalService.open(RegisterComponent, { size: "lg", centered: true });
  }

  logout() {
    this.modalService.open(LogoutComponent, { size: "lg", centered: true });
  }

  programs() {
    this.modalService.open(ProgramsComponent, { size: "lg", centered: true });
  }

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthenticated(access_token)
        .then(user => {
          if (user.id_role) {
            this.isLoggedIn = true;
            this.username = user.username;
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}
