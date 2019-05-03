import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, throwError } from "rxjs";
import { debounceTime, map, catchError } from "rxjs/operators";

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
      .pipe(
        map(user => {
          // console.log("USER STATUS", user);
          if (user) {
            const message = user.message;
            this._success.subscribe(message => (this.successMessage = message));
            this._success.pipe(debounceTime(1800)).subscribe(() => {
              // this.errorMessage = null;
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);

            // redirect ?
            if (this.auth.redirectUrl) {
              this.router.navigate([this.auth.redirectUrl]);
            }

            return user;
          }
        }),
        catchError(this.handleError)
      )
      .subscribe(
        data => {
          // console.debug("login data:", data)
        },
        errorMessage => {
          // console.debug("errorMessage", errorMessage);
          // window.alert(errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  handleError(error) {
    let errorMessage = "";
    if (error.error instanceof ErrorEvent) {
      console.error("client-side error");
      // client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      console.error("server-side error", error);
      if (error.error && error.error.message) {
        // api error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(errorMessage);
  }

  displayErrorMessage(message) {
    this._error.next(message);
    // console.log("errorMessage:", message);
  }

  displaySuccessMessage(message) {
    this._success.next(message);
    // console.log("successMessage:", message);
  }
}
