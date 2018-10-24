import { AuthService } from "./../../auth/auth.service";
import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../../conf/app.config";
import { stringify } from "@angular/core/src/util";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoginComponent } from "../../auth/login/login.component";
import { RegisterComponent } from "../../auth/register/register.component";
import { LogoutComponent } from "../../auth/logout/logout.component";

@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.css"]
})
export class TopbarComponent implements OnInit {
  title: string = AppConfig.appName;
  isLoggedIn: boolean = false;
  username: string = "not defined";

  constructor(private auth: AuthService, private modalService: NgbModal) {}

  // modal(content) {
  //   this.modalService.open(content, {size: 'lg',centered:true});
  // }

  login() {
    this.modalService.open(LoginComponent, { size: "lg", centered: true });
  }

  register() {
    this.modalService.open(RegisterComponent, { size: "lg", centered: true });
  }

  logout() {
    this.modalService.open(LogoutComponent, { size: "lg", centered: true });
  }

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthenticated(access_token)
        .then(user => {
          console.log("LoggerUser Get Status", user.status);
          if (user.status == "200") {
            this.isLoggedIn = true;
            this.username = user.json().username;
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}
