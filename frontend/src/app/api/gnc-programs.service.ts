import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { AppConfig } from '../../conf/app.config';
import { Program } from '../programs/programs.models';


export interface IGeoFeatureProgramAdapter {
  properties: Program
}

export interface IGeoFeatures {
  type: string
  features: IGeoFeatureProgramAdapter[]
  count: number
}

@Injectable({
  providedIn: 'root'
})
export class GncProgramsService {
  private readonly URL = AppConfig.API_ENDPOINT;

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(result as T);
    };
  }

  constructor(protected http: HttpClient) { }

  getAllPrograms(): Observable<Program[]> {
    return this.http.get<IGeoFeatures>(`${this.URL}/programs`)
      .pipe(
        map(adapted => adapted.features),
        map(featureCollection => featureCollection.map(feature => feature.properties)),
        tap(p => console.debug('GncProgramsService: programs ', p)),
      )
  }

  getProgram(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.URL}/programs/${id}`).pipe(
      tap(_ => console.debug(`fetched program ${id}`)),
      catchError(this.handleError<Program>(`getProgram id=${id}`))
    );
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
