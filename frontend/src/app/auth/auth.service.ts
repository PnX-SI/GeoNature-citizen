import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { share, map, tap, take, catchError, finalize } from "rxjs/operators";

import { AppConfig } from "../../conf/app.config";
import { LoginUser, RegisterUser, JWT, TokenRefresh } from "./models";

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  redirectUrl: string;
  authenticated$ = new BehaviorSubject<boolean>(this.hasRefreshToken());
  authorized$ = new BehaviorSubject<boolean>(this.hasAccessToken());
  timeoutID: any = null;

  constructor(private http: HttpClient, private router: Router) {}

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
            // options:
            // - utilize observer timer and trigger auto renewal on login, stopping on logout or invalidation
            // - decode token header and payload, extract exp and refresh accordingly and proactively when possible
            //
            // clearInterval(this.timeoutID);
            // this.timeoutID = setInterval(() => {
            //   console.debug("refreshing");
            //   this.performTokenRefresh(localStorage.getItem("refresh_token")).pipe(
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
      this.router.navigate(["/home"]);
    }
  }

  ensureAuthenticated(_access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers }).toPromise();
  }

  performTokenRefresh(): Observable<void | Object> {
    const url: string = `${AppConfig.API_ENDPOINT}/token_refresh`;
    const refresh_token = this.getRefreshToken();
    const headers = this.headers.set(
      "Authorization",
      `Bearer ${refresh_token}`
    );
    return this.http.post(url, refresh_token, { headers: headers }).pipe(
      tap(data =>
        console.debug("[AuthService.performTokenRefresh] result", data)
      ),
      take(1),
      map((data: TokenRefresh) => {
        if (data && data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
      }),
      catchError(error => {
        console.error(`[AuthService.performTokenRefresh] error "${error}"`);
        this.logout("bla");
        return this.router.navigate(["/home"]);
      }),
      finalize(() => {
        console.debug("done");
      })
    );
  }

  // TODO: verify service to delete account in response to GDPR recommandations
  selfDeleteAccount(_access_token): Promise<any> {
    let url: string = `${AppConfig.API_ENDPOINT}/user/delete`;
    return this.http.delete(url, { headers: this.headers }).toPromise();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authorized$.pipe(share());
  }

  getRefreshToken(): string {
    return localStorage.getItem("refresh_token");
  }

  getAccessToken(): string {
    return localStorage.getItem("access_token");
  }

  private hasRefreshToken(): boolean {
    return !!localStorage.getItem("refresh_token");
  }

  private hasAccessToken(): boolean {
    return !!localStorage.getItem("access_token");
  }

  decodeToken(token: string): JWT {
    if (!token) return;
    const parts: any[] = token.split(".");
    if (parts.length < 3) return;
    try {
      return {
        header: JSON.parse(atob(parts[0])),
        payload: JSON.parse(atob(parts[1]))
      };
    } catch (error) {
      console.error(error);
      return;
    }
  }

  tokenExpiration(token: string): number {
    if (!token) return;
    const jwt = this.decodeToken(token);
    if (!jwt) return;
    const now: number = new Date().getTime();
    const expiration: number = (jwt.payload.exp - now) / 1000;
    console.debug(`[token] expiration in ${expiration}`);
    return expiration;
  }
}
