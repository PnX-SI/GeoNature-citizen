import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { GncProgramsService } from '../api/gnc-programs.service'

@Injectable({
  providedIn: 'root'
})
export class UniqueProgramGuard implements CanActivate, CanActivateChild {
  constructor(private programService: GncProgramsService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      let count = 0
      this.programService.getAllPrograms().subscribe(programs => {
        count = (programs) ? programs.length : count
        console.debug(`UniqueProgramGuard program count: ${count}`, programs)
      })
      if (count > 1) {
        // FIXME: route snapshot data ?  program = programs[0]
        return true
      }
      this.router.navigate(['/programs'])
      return false
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state)
  }
}
