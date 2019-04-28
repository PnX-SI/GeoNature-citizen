import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from "@angular/common/http";
import { Router } from "@angular/router";
import {
  catchError,
  switchMap,
  finalize,
  take,
  filter,
  tap,
  map,
  first
} from "rxjs/operators";
import { Observable, throwError, BehaviorSubject, from } from "rxjs";

import { AuthService } from "./auth.service";
import { TokenRefresh } from "./models";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refreshing = false;
  token$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private auth: AuthService, private router: Router) {}

  addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      return request;
    }
  }

  handle401(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // error.error.msg === "Token has expired";
    if (!this.refreshing) {
      this.refreshing = true;
      this.token$.next(null);

      return this.auth.performTokenRefresh().pipe(
        take(1),
        tap(token => {
          console.debug("[AuthInterceptor.performTokenRefresh] result", token);
        }),
        map((data: TokenRefresh) => {
          if (data && data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            this.token$.next(data.access_token);
            return next.handle(this.addToken(request, data.access_token));
          }

          this.auth.logout();
          return from(this.router.navigate(["/home"]));
        }),
        catchError(error => {
          console.error(
            `[AuthInterceptor.performTokenRefresh] error "${error}"`
          );
          this.router.navigate(["/home"]);
          return from(this.auth.logout());
        }),
        finalize(() => {
          console.debug("done");
          this.refreshing = false;
        })
      );
    } else {
      return this.token$.pipe(
        filter(token => token != null),
        switchMap((token: string) =>
          next.handle(this.addToken(request, token))
        ),
        first()
      );
    }
  }

  async handle400(error): Promise<any> {
    console.error(`[400 handler] "${error.message}"`);
    // this.auth.logout();
    return from(this.router.navigateByUrl("/home"));
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      request.url.includes("token_refresh") ||
      request.url.includes("registration") ||
      request.url.includes("login") ||
      request.url.includes("logout")
    ) {
      return next.handle(request.clone());
    }
    let errorMessage = "";

    let expired = this.auth.tokenExpiration(this.auth.getAccessToken());
    // renew two min before expiration
    if (expired && expired <= 120.0 && expired > 0.5) {
      console.debug(
        `[AuthInterceptor.intercept] token is about to expire: ${expired}`
      );
      return this.handle401(request, next);
    } else {
      // console.warn(`[AuthInterceptor.intercept] expiring token: ${expired}`);
    }

    return next.handle(this.addToken(request, this.auth.getAccessToken())).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          // client-side or network
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // api call failure response
          switch (error.status) {
            case 400:
            case 422:
              return this.handle400(error);
            case 401:
              console.debug(
                `[AuthInterceptor.intercept] handling "${error.error.msg}"`
              );
              return this.handle401(request, next);
            default:
              errorMessage = `Error Code: ${error.status}\nMessage: ${
                error.message
              }`;
          }
        }
        // window.alert(errorMessage);
        // console.error(errorMessage);
        return throwError(errorMessage);
      })
    );
  }
}
