import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from "@angular/common/http";
import {
  catchError,
  switchMap,
  finalize,
  take,
  filter,
  tap
} from "rxjs/operators";
import { Observable, throwError, BehaviorSubject } from "rxjs";

import { AuthService } from "./auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refreshing = false;
  token$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private auth: AuthService) {}

  addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  handle401(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> | Promise<any> {
    // error.error.msg === "Token has expired";
    if (
      request.url.includes("token_refresh") ||
      request.url.includes("login")
    ) {
      if (request.url.includes("token_refresh")) {
        this.auth.logout("bla");
      }
      return throwError("Not authenticated");
    }
    if (!this.refreshing) {
      this.refreshing = true;
      this.token$.next(null);

      return this.auth.refreshToken(localStorage.getItem("refresh_token")).pipe(
        tap(data => console.debug("new access_token", data)),
        switchMap(data => {
          if (data && data["access_token"]) {
            localStorage.setItem("access_token", data["access_token"]);
            this.token$.next(data["access_token"]);
            return next.handle(this.addToken(request, data["access_token"]));
          }

          return this.auth.logout("bla");
        }),
        catchError(error => {
          console.error(`[refresh token] error "${error}"`);
          return this.auth.logout("bla");
        }),
        finalize(() => {
          console.debug("done");
          this.refreshing = false;
        })
      );
    } else {
      return this.token$.pipe(
        filter(token => token != null),
        take(1),
        switchMap((token: string) => next.handle(this.addToken(request, token)))
      );
    }
  }

  async handle400(error): Promise<any> {
    console.error(`[400 handler] "${error.message}"`);
    return this.auth.logout("bla");
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let errorMessage = "";
    return next
      .handle(this.addToken(request, localStorage.getItem("access_token")))
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.error instanceof ErrorEvent) {
            // client-side or network
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // api call failure response
            switch (error.status) {
              case 400:
                return this.handle400(error);
              case 401:
                console.debug(`handling "${error.error.msg}"`);
                return this.handle401(request, next);
              default:
                errorMessage = `Error Code: ${error.status}\nMessage: ${
                  error.message
                }`;
            }
          }
          window.alert(errorMessage);
          return throwError(errorMessage);
        })
      );
  }
}
