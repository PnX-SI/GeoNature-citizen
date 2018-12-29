import { Component } from "@angular/core";
import { AuthService } from "./../auth.service";
import { RegisterUser } from "./../models";
import { Router } from "@angular/router";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { debounceTime } from "rxjs/operators";
import { Subject } from "rxjs";
import { LoginUser } from "../models";

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
      .then(user => {
        localStorage.setItem("access_token", user.access_token);
        localStorage.setItem("refresh_token", user.refresh_token);
        localStorage.setItem("username", user.username);
        console.log(user.status);
        if (user) {
          let message = user.message;
          setTimeout(() => (this.staticAlertClosed = true), 20000);
          this._success.subscribe(message => (this.successMessage = message));
          this._success
            .pipe(debounceTime(5000))
            .subscribe(() => (this.successMessage = null));
          this.displaySuccessMessage(message);
          this.router.navigate(["/"]);
          this.activeModal.close();
        }
      })
      .catch(err => {
        let message = err.error.message;
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
    console.log("errorMessage:", message);
  }

  displaySuccessMessage(message) {
    this._success.next(message);
    console.log("successMessage:", message);
  }
}
