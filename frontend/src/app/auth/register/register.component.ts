import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, throwError } from "rxjs";
import { debounceTime, catchError, map } from "rxjs/operators";

import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

import { RegisterUser } from "../models";
import { AuthService } from "./../auth.service";

@Component({
  selector: "register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"]
})
export class RegisterComponent {
  user: RegisterUser = new RegisterUser();
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

  onRegister(): void {
    this.auth
      .register(this.user)
      .pipe(
        map(user => {
          localStorage.setItem("access_token", user.access_token);
          localStorage.setItem("refresh_token", user.refresh_token);
          localStorage.setItem("username", user.username);
          console.log(user.status);
          if (user) {
            let message = user.message;
            // setTimeout(() => (this.staticAlertClosed = true), 20000);
            this._success.subscribe(message => (this.successMessage = message));
            this._success.pipe(debounceTime(5000)).subscribe(() => {
              this.successMessage = null;
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);
            // redirect ?
            if (this.auth.redirectUrl) {
              this.router.navigate([this.auth.redirectUrl]);
            }
          }
        }),
        catchError(this.handleError)
      )
      .subscribe(
        _data => {},
        errorMessage => {
          // console.debug("errorMessage", errorMessage);
          // window.alert(errorMessage);
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
      if (error.error && error.error.error_message) {
        // api error
        // FIXME: response fields consistency
        errorMessage = error.error.error_message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(errorMessage);
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
