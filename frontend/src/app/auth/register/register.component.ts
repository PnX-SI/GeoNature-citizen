import {Component} from '@angular/core';
import {AuthService} from './../auth.service';
import {RegisterUser} from './../models';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {debounceTime} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {LoginUser} from '../models';

@Component({
  selector: 'register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user: RegisterUser = new RegisterUser();
  private _error = new Subject<string>();
  staticAlertClosed = false;
  errorMessage: string;

  constructor(
    private auth: AuthService,
    public activeModal: NgbActiveModal
  ) {
  }

  onRegister(): void {
    this.auth
      .register(this.user)
      .then(user => {
        localStorage.setItem('access_token', user.json().access_token);
        localStorage.setItem('refresh_token', user.json().refresh_token);
        localStorage.setItem('username', user.json().username);
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
