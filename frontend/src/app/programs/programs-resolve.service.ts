import { Injectable } from "@angular/core";
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from "@angular/router";
import { Observable, of, EMPTY } from "rxjs";
import { take, mergeMap, tap } from "rxjs/operators";

import { GncProgramsService } from "../api/gnc-programs.service";
import { Program } from "./programs.models";

@Injectable({
  providedIn: "root"
})
export class ProgramsResolve implements Resolve<Program[]> {
  constructor(
    private programService: GncProgramsService,
    private router: Router
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Program[]> | Observable<never> {
    return this.programService.getAllPrograms().pipe(
      take(1),
      // tap(p => console.debug(p)),
      mergeMap((programs: Program[]) => {
        if (programs) {
          return of(programs);
        } else {
          return EMPTY;
        }
      })
    );
  }
}
