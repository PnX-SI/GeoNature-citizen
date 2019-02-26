import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { AuthService } from "./auth.service";
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem("access_token");
    const cloned = token
      ? request.clone({
          withCredentials: true,
          headers: request.headers.set("Authorization", `Bearer ${token}`)
        })
      : request;

    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && err.error.msg === "Token has expired") {
          this.auth.getRefreshToken(token).pipe(
            map(token => {
              localStorage.setItem("access_token", token["access_token"]);
            })
          );
          // this.auth.logout(token);
          location.reload(true);
        }
        const error = err.error.msg || err.statusText;
        return throwError(error);
      })
    );
  }
}
