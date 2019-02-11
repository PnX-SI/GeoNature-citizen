import { Injectable, OnInit, Optional, SkipSelf } from "@angular/core";
import {
  DomSanitizer,
  TransferState,
  makeStateKey
} from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, tap, map, take, mergeMap } from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";

import { AppConfig } from "../../conf/app.config";
import { Program } from "../programs/programs.models";

const PROGRAMS_KEY = makeStateKey("programs");

export interface IGncProgram extends Feature {
  properties: Program;
}

export interface IGncFeatures extends FeatureCollection {
  features: IGncProgram[];
  count: number;
}

@Injectable({
  deps: [
    [new Optional(), new SkipSelf(), GncProgramsService],
    HttpClient,
    TransferState,
    DomSanitizer
  ],
  providedIn: "root",
  useFactory: (
    instance: GncProgramsService | null,
    http: HttpClient,
    state: TransferState,
    domSanitizer: DomSanitizer
  ) => instance || new GncProgramsService(http, state, domSanitizer)
})
export class GncProgramsService implements OnInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  programs: Program[];
  programs$: Observable<Program[]>;

  constructor(
    protected http: HttpClient,
    private state: TransferState,
    protected domSanitizer: DomSanitizer
  ) {
    this.programs$ = of(this.programs);
  }

  ngOnInit() {
    this.programs = this.state.get(PROGRAMS_KEY, null as any);
  }

  getGeoFeatures(features): Observable<IGncFeatures> {
    return this.http.get<IGncFeatures>(`${this.URL}/${features}`);
  }

  getAllPrograms(): Observable<Program[]> {
    if (!this.programs) {
      return this.getGeoFeatures("programs").pipe(
        map(featureCollection => featureCollection.features),
        map(feature => feature.map(feature => feature.properties)),
        map(programs =>
          programs.map(program => {
            program.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(
              program.short_desc
            );
            program.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(
              program.long_desc
            );
            return program;
          })
        ),
        tap(programs => {
          this.programs = programs;
          this.state.set(PROGRAMS_KEY, programs as any);
          console.debug("GncProgramsService: programs ", programs);
        }),
        catchError(this.handleError<Program[]>("getAllPrograms"))
      );
    }
  }

  getProgram(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.URL}/programs/${id}`).pipe(
      tap(_ => console.debug(`fetched program ${id}`)),
      catchError(this.handleError<Program>(`getProgram id=${id}`))
    );
  }

  getProgramObservations(id: number): Observable<IGncFeatures> {
    return this.http
      .get<IGncFeatures>(`${this.URL}/programs/${id}/observations`)
      .pipe(
        catchError(
          this.handleError<IGncFeatures>(`getProgramObservations id=${id}`)
        )
      );
  }

  getProgramTaxonomyList(program_id: number): Observable<any[]> {
    return of(this.programs).pipe(
      map(programs => programs.filter(p => p.id_program == program_id)),
      take(1),
      // tap(progs => console.debug("progs", progs)),
      mergeMap(programs => {
        return this.http.get<any[]>(
          `${this.URL}/taxonomy/lists/${programs[0]["taxonomy_list"]}/species`
        );
      }),
      // tap(n => console.debug("taxlist", n)),
      catchError(this.handleError<any[]>(`getProgramTaxonomyList`))
    );
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(result as T);
    };
  }

  // public createProgram(program: Program): Observable<Program> {
  //   return this.http
  //     .post<Program>(`${this.URL}/programs`, program)
  //     .map(response => response.json() || []);
  // }

  // public updateProgram(program: Program): Observable<Program> {
  // return this.http
  //   .put<Program>(`${this.URL}/programs/${program.id_program}`, program)
  //   .map(response => response.json() || []);
  // }

  // public deleteProgram(program: Program): Observable<Program> {
  //   return this.http
  //     .delete<Program>(`${this.URL}/programs/${program.id_program}`)
  //     .map(response => response.json() || []);
  // }
}
