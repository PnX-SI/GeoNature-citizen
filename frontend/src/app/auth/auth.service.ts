import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LoginUser, RegisterUser } from "./models";
import { AppConfig } from "../../conf/app.config";
import { Router } from "@angular/router";
import { Observable } from "rxjs";

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
    return this.http.post(url, { headers: this.headers }).toPromise();
  }

  ensureAuthenticated(access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/logged_user`;
    return this.http.get(url, { headers: this.headers }).toPromise();
  }

  getRefreshToken(access_token): Observable<Object> {
    const url: string = `${AppConfig.API_ENDPOINT}/token_refresh`;
    return this.http.post(url, access_token, { headers: this.headers });
  }
}
