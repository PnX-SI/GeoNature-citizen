import { AuthService } from "./../auth.service";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-logout",
  templateUrl: "./logout.component.html",
  styleUrls: ["./logout.component.css"]
})
export class LogoutComponent {
  constructor(
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  onLogout(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .logout()
        .then(logout => {
          console.log("LogoutUser Get Status", logout.status);
        })
        .catch(err => {
          console.log(err);
        });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      this.router.navigate(["/"]);
      this.activeModal.close();
    }
  }
}
