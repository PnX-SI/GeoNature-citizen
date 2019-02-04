import { Injectable } from '@angular/core'
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'

import { GncProgramsService } from '../api/gnc-programs.service'
import { Program } from './programs.models'

@Injectable({
  providedIn: 'root'
})
export class UniqueProgramGuard implements CanActivate, CanActivateChild {
  constructor(private programService: GncProgramsService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    let count = 0
    let programs: Program[]
    return this.programService.getAllPrograms().pipe(  // FIXME: leverage resolve
      map((p: Program[]) => {
        count = (p) ? p.length : count
        programs = (p) ? p : undefined
        console.debug(`UniqueProgramGuard program count: ${count}`, programs)
        if (count === 1) {
          this.router.navigate(['programs', programs[0].id_program, 'observations'])
          return false
        }
        return true
      }),
      catchError(_e => of(true))
    )
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state)
  }
}
