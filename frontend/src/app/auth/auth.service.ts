import { Injectable } from "@angular/core";
import { Headers, Http } from "@angular/http";
import { LoginUser, RegisterUser } from "./models";

@Injectable()
export class AuthService {
  private BASE_URL: string = "http://localhost:5001/api";
  private headers: Headers = new Headers({
    "Content-Type": "application/json"
  });
  constructor(private http: Http) {}
  login(user: LoginUser): Promise<any> {
    let url = `${this.BASE_URL}/login`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
    console.log('LoginProcess');
  }
  register(user: RegisterUser): Promise<any> {
    let url: string = `${this.BASE_URL}/registration`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
  }
  logout(access_token): Promise<any> {
    let url: string = `${this.BASE_URL}/logout`;
    let headers: Headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.post(url, { headers: headers }).toPromise();
  }
  ensureAuthenticated(access_token): Promise<any> {
    let url: string = `${this.BASE_URL}/logged_user`;
    let headers: Headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.get(url, { headers: headers }).toPromise();
  }
}
