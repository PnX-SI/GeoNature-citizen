import { Component } from "@angular/core";
import { AuthService } from "./../auth.service";
import { RegisterUser } from "./../models";

@Component({
  selector: "register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"]
})
export class RegisterComponent {
  user: RegisterUser = new RegisterUser();
  constructor(private auth: AuthService) {}
  onRegister(): void {
    this.auth
      .register(this.user)
      .then(user => {
        localStorage.setItem('access_token', user.json().access_token);
        localStorage.setItem('refresh_token', user.json().refresh_token);
        localStorage.setItem('username', user.json().username);
      })
      .catch(err => {
        console.log(err);
      });
  }
}
