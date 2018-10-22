import { AuthService } from './../auth.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const refresh_token = localStorage.getItem("refresh_token");
    const refresh_token = localStorage.getItem("refresh_token");
    if (refresh_token) {
      this.auth
        .logout(refresh_token)
        .then(logout => {
          console.log("LogoutUser Get Status", logout.status);
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}
