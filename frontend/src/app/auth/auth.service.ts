import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { share, map, tap, switchMap } from "rxjs/operators";

import { AppConfig } from "../../conf/app.config";
import { LoginUser, RegisterUser } from "./models";

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  redirectUrl: string;
  authenticated$ = new BehaviorSubject<boolean>(this.hasRefreshToken());
  authorized$ = new BehaviorSubject<boolean>(this.hasAccessToken());
  timeoutID: any = null;

  constructor(private http: HttpClient) {}

  login(user: LoginUser): Promise<any> {
    let url = `${AppConfig.API_ENDPOINT}/login`;
    return this.http
      .post(url, user, { headers: this.headers })
      .pipe(
        map(user => {
          if (user) {
            localStorage.setItem("access_token", user["access_token"]);
            this.authorized$.next(true);
            localStorage.setItem("refresh_token", user["refresh_token"]);
            this.authenticated$.next(true);
            localStorage.setItem("username", user["username"]);
            clearInterval(this.timeoutID);
            // ought to utilize observer interval if autorenewal concept proves itself worthy of time investment
            // this.timeoutID = setInterval(() => {
            //   console.debug("refreshing");
            //   this.refreshToken(localStorage.getItem("refresh_token")).pipe(
            //     tap(data => console.debug("new access_token", data))
            //     switchMap(data => {
            //       if (data && data["access_token"]) {
            //         localStorage.setItem("access_token", data["access_token"]);
            //       }
            //     })
            //   );
            // }, 10 * 1000);
          }
          return user;
        })
      )
      .toPromise();
  }

  register(user: RegisterUser): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/registration`;
    return this.http.post(url, user, { headers: this.headers }).toPromise();
  }

  logout(_access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/logout`;
    try {
      this.authorized$.next(false);
      return this.http.post(url, { headers: this.headers }).toPromise();
    } catch (error) {
      console.error(`[logout] error "${error}"`);
      localStorage.removeItem("access_token");
      this.authorized$.next(false);
      localStorage.removeItem("refresh_token");
      this.authenticated$.next(false);
      localStorage.removeItem("username");
    }
  }

  ensureAuthenticated(_access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers }).toPromise();
  }

  refreshToken(refresh_token: string): Observable<Object> {
    const url: string = `${AppConfig.API_ENDPOINT}/token_refresh`;
    let headers = this.headers.set("Authorization", `Bearer ${refresh_token}`);
    return this.http.post(url, refresh_token, { headers: headers });
  }

  // TODO: verify service to delete account in response to GDPR recommandations
  selfDeleteAccount(_access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/delete`;
    return this.http.delete(url, { headers: this.headers }).toPromise();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authorized$.pipe(share());
  }

  private hasRefreshToken(): boolean {
    return !!localStorage.getItem("refresh_token");
  }

  private hasAccessToken(): boolean {
    return !!localStorage.getItem("access_token");
  }
}
