import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LoginUser, RegisterUser } from "./models";
import { AppConfig } from "../../conf/app.config";
import { Router } from "@angular/router";

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  redirectUrl: string;

  constructor(private http: HttpClient, private router: Router) {}

  login(user: LoginUser): Promise<any> {
    let url = `${AppConfig.API_ENDPOINT}/login`;
    // withCredentials: true
    return this.http.post(url, user, { headers: this.headers }).toPromise();
  }

  register(user: RegisterUser): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/registration`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
  }

  logout(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/logout`;
    let headers_with_bearer: HttpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.post(url, { headers: headers_with_bearer }).toPromise();
  }

  ensureAuthenticated(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/info`;
    let headers_with_bearer: HttpHeaders = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    });
    return this.http.get(url, { headers: headers_with_bearer }).toPromise();
  }

  // TODO: verify service to delete account in response to GDPR recommandations
  selfDeleteAccount(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/delete`;
    let headers_with_bearer: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`
    });
    return this.http.delete(url, { headers: headers_with_bearer }).toPromise();
  }
}
