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
  map
} from "rxjs/operators";
import { Observable, throwError, BehaviorSubject } from "rxjs";

import { AuthService } from "./auth.service";
import { TokenRefresh } from "./models";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refreshing = false;
  token$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private auth: AuthService, private router: Router) {}

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

      return this.auth.performTokenRefresh();
      // .pipe(
      //   tap(data =>
      //     console.debug("[AuthInterceptor.performTokenRefresh] result", data)
      //   ),
      //   take(1),
      //   map((data: TokenRefresh) => {
      //     if (data && data.access_token) {
      //       localStorage.setItem("access_token", data.access_token);
      //       this.token$.next(data.access_token);
      //       return next.handle(this.addToken(request, data.access_token));
      //     }
      //
      //     this.auth.logout("bla");
      //     return this.router.navigate(["/home"]);
      //   }),
      //   catchError(error => {
      //     console.error(
      //       `[AuthInterceptor.performTokenRefresh] error "${error}"`
      //     );
      //     return this.auth.logout("bla");
      //   }),
      //   finalize(() => {
      //     console.debug("done");
      //     this.refreshing = false;
      //   })
      // );
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
    this.auth.logout("bla");
    return this.router.navigate(["/home"]);
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let errorMessage = "";
    // wip
    let expired = this.auth.tokenExpiration(this.auth.getAccessToken());
    console.debug(`[AuthInterceptor.intercept] token expired: ${expired > 0}`);
    if (expired > 0) {
      this.auth.performTokenRefresh().pipe(
        tap(data =>
          console.debug(
            "[AuthInterceptor.intercept] performTokenRefresh result",
            data
          )
        ),
        take(1),
        map((data: TokenRefresh) => {
          if (data && data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            this.token$.next(data.access_token);
            return next.handle(this.addToken(request, data.access_token));
          }
        })
      );
    }
    //

    return next.handle(this.addToken(request, this.auth.getAccessToken())).pipe(
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
        window.alert(errorMessage);
        return throwError(errorMessage);
      })
    );
  }
}
