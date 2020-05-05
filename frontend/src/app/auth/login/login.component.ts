import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Subject, throwError } from "rxjs";
import { debounceTime, map, catchError } from "rxjs/operators";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AppConfig } from "../../../conf/app.config";
import { LoginUser } from "./../models";
import { AuthService } from "./../auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})

export class LoginComponent {
  AppConfig = AppConfig;
  private _error = new Subject<string>();
  private _success = new Subject<string>();
  errorMessage: string;
  successMessage: string;
  staticAlertClosed = false;
  user: LoginUser = { email: "", password: "" };
  recovery = { username: "", email: "" };
  recoverPassword = false;

  constructor(
    protected http: HttpClient,
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  onLogin(): void {
    this.auth
      .login(this.user)
      .pipe(
        map(user => {
          if (user) {
            const message = user.message;
            this._success.subscribe(message => (this.successMessage = message));
            this._success.pipe(debounceTime(1800)).subscribe(() => {
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);

            if (this.auth.redirectUrl) {
              this.router.navigate([this.auth.redirectUrl]);
            }

            return user;
          }
        }),
        catchError(error => this.handleError(error))
      )
      .subscribe(
        _data => {},
        errorMessage => {
          console.error("errorMessage", errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  onRecoverPassword(): void {
    this.http
      .post(`${AppConfig.API_ENDPOINT}/user/resetpasswd`, this.recovery)
      .subscribe(
        (response) => {      
          const message = response["message"];
          this._success.subscribe(message => (this.successMessage = message));
          this._success.pipe(debounceTime(5000)).subscribe(() => {
            this.activeModal.close();
          });
          this.displaySuccessMessage(message);
        },
        (errorMessage) => {
          this.successMessage = null;
          this.errorMessage = errorMessage.error.message;
          this.displayErrorMessage(this.errorMessage);
        }
      );
  }

  handleError(error) {
    let errorMessage = "";
    if (error.error instanceof ErrorEvent) {
      // client-side or network error
    } else {
      // server-side error
      if (error.error && error.error.message) {
        // api error
        errorMessage = `${error.error.message}`;
      } else if (error.status && error.message) {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      } else {
        errorMessage = error;
      }
    }
    return throwError(errorMessage);
  }

  displayErrorMessage(message) {
    this._error.next(message);
  }

  displaySuccessMessage(message) {
    this._success.next(message);
  }
}
