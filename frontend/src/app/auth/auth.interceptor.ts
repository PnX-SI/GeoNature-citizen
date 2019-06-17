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

import { AppConfig } from "../../conf/app.config";
import { AuthService } from "./auth.service";
import { TokenRefresh } from "./models";
import { ErrorHandler } from "../api/error_handler";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refreshing = false;
  token$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    public errorHandler: ErrorHandler,
    private auth: AuthService,
    private router: Router
  ) {}

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
          this.errorHandler.handleError(error);
          this.router.navigate(["/home"]);
          return from(this.auth.logout());
        }),
        finalize(() => {
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
    this.errorHandler.handleError(error);
    return from(this.router.navigateByUrl("/home"));
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      (request.url.match(AppConfig.API_ENDPOINT) &&
        (request.url.includes("token_refresh") ||
          request.url.includes("registration") ||
          request.url.includes("login"))) ||
      !request.url.match(AppConfig.API_ENDPOINT)
    ) {
      return next.handle(request);
    }

    // renew access_token 2min before expiration if interacting with backend api.
    const expired = this.auth.tokenExpiration(this.auth.getAccessToken());
    if (expired && expired <= 120.0) {
      return this.handle401(request, next);
    }

    return next.handle(this.addToken(request, this.auth.getAccessToken())).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!(error.error instanceof ErrorEvent)) {
          // api call failure response
          switch (error.status) {
            case 400:
            case 422:
              return this.handle400(error);
            case 401:
              return this.handle401(request, next);
            default:
              /*
              When the flask backend is in debug mode ,
              no cors header is returned upon error so
              error.status=0, error.statusText="Unknown Error"
              and error.message="Http failure response for (unknown url): 0 Unknown Error".
              See comment in backend/server.py below flask_cors init.
              */
              if (error.status !== 0) {
                console.error("error: ", error);
              }
          }
        }
        this.errorHandler.handleError(error);
        console.error(error);
        return throwError(error);
      })
    );
  }
}
