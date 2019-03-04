import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { LoginUser } from "./models";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {
  user = undefined;

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    this.authService.redirectUrl = state.url;
    const token = localStorage.getItem("access_token");
    if (token) {
      return new Promise(resolve => {
        this.authService
          .ensureAuthenticated(token)
          .then((user: LoginUser) => {
            console.debug("user", user);
            resolve(true);
          })
          .catch(error => {
            console.error("[AuthGuard] canActivate error", error);
            this.authService.logout("bla");
            this.router.navigate(["/home"]);
            resolve(false);
          });
      });
    }

    this.router.navigate(["/home"]);
    return false;
  }
}
