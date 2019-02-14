import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { LoginComponent } from "./login/login.component";
import { LoginUser } from "./models";

@Injectable({
  providedIn: "root"
})
export class AuthGuard implements CanActivate {
  modalRef: NgbModalRef;
  user = undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    /*
    this.authService.redirectUrl = state.url;
    const token = localStorage.getItem("access_token");
    if (token) {
      return new Promise(resolve => {
        this.authService
          .ensureAuthenticated(token)
          .then((user: LoginUser) => {
            console.debug("user", user);
            this.router.navigate([state.url]);
            resolve(true);
          })
          .catch(error => {
            console.debug(error);
            this.modalRef = this.modalService.open(LoginComponent, {
              size: "lg",
              centered: true
            });
            resolve(false);
          });
      });
    }
    */
    return true;
  }
}
