import { AuthService } from "./../auth.service";
import { Subject } from "rxjs";
import { Component } from "@angular/core";
import { LoginUser } from "./../models";
import { Router } from "@angular/router";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent {
  user: LoginUser = new LoginUser();
  private _error = new Subject<string>();
  staticAlertClosed = false;
  message: string;
  errorMessage: string;

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(): void {
    this.auth
      .login(this.user)
      .then(user => {
        localStorage.setItem("access_token", user.json().access_token);
        localStorage.setItem("refresh_token", user.json().refresh_token);
        localStorage.setItem("username", user.json().username);
        console.log(user.status);
        if (user.status == 200) {
          this.router.navigate(["/"]);
        }
      })
      .catch(err => {
        let message = err.json().error_message;
        console.log("ERREUR", message);
        setTimeout(() => (this.staticAlertClosed = true), 20000);
        this._error.subscribe(message => (this.errorMessage = message));
        this._error
          .pipe(debounceTime(5000))
          .subscribe(() => (this.errorMessage = null));
        this.displayErrorMessage(message);
      });
  }

  displayErrorMessage(message) {
    this._error.next(message);
    console.log("MESSAGE TO DISPLAY", message);
  }
}
