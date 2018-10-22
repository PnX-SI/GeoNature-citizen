import { Injectable } from "@angular/core";
import { Headers, Http } from "@angular/http";
import { LoginUser, RegisterUser } from "./models";
import { AppConfig } from "../../conf/app.config";

@Injectable()
export class AuthService {
  private headers: Headers = new Headers({
    "Content-Type": "application/json"
  });
  constructor(private http: Http) {}
  login(user: LoginUser): Promise<any> {
    let url = `${AppConfig.API_ENDPOINT}/login`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
    console.log('LoginProcess');
  }
  register(user: RegisterUser): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/registration`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
  }
  logout(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/logout`;
    let headers: Headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.post(url, { headers: headers }).toPromise();
  }
  ensureAuthenticated(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/logged_user`;
    let headers: Headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.get(url, { headers: headers }).toPromise();
  }
}
