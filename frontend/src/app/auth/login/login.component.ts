import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

import { LoginUser } from "./../models";
import { AuthService } from "./../auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent {
  user: LoginUser = { username: "", password: "" };
  private _error = new Subject<string>();
  private _success = new Subject<string>();
  staticAlertClosed = false;
  errorMessage: string;
  successMessage: string;

  constructor(
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  onLogin(): void {
    this.auth
      .login(this.user)
      .toPromise()
      .then(user => {
        console.log("USER STATUS", user);
        if (user) {
          const message = user.message;
          setTimeout(() => (this.staticAlertClosed = true), 20000);
          this._success.subscribe(message => (this.successMessage = message));
          this._success
            .pipe(debounceTime(5000))
            .subscribe(() => (this.successMessage = null));
          this.displaySuccessMessage(message);
          let redirect = this.auth.redirectUrl ? this.auth.redirectUrl : "/";
          this.router.navigate([redirect]);
          this.activeModal.close();
        }
      })
      .catch(err => {
        const message = err.error.message;
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
    console.log("errorMessage:", message);
  }

  displaySuccessMessage(message) {
    this._success.next(message);
    console.log("successMessage:", message);
  }
}
