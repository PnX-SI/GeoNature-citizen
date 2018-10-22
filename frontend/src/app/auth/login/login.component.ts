import { AuthService } from './../auth.service';
import { Component, OnInit } from '@angular/core';
import { LoginUser } from './../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  user: LoginUser = new LoginUser();
  constructor(private auth: AuthService) {}
  onLogin(): void {
    this.auth.login(this.user)
    .then((user) => {
      localStorage.setItem('access_token', user.json().access_token);
      localStorage.setItem('refresh_token', user.json().refresh_token);
      localStorage.setItem('username', user.json().username);
    })
    .catch((err) => {
      console.log(err);
    });
  }
}
