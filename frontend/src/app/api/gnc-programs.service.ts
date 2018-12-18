import { HttpClient } from '@angular/common/http';
import { GncService } from './gnc.service';
// angular
import { Injectable } from '@angular/core';
// rxjs
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
// config
import { AppConfig } from '../../conf/app.config';
// models
import { Program } from '../programs/programs.models';

@Injectable({
  providedIn: 'root'
})
export class GncProgramsService {
  private readonly URL = AppConfig.API_ENDPOINT;

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(error);
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  private log(log: string) {
    console.info(log);
  }

  constructor(
    protected http: HttpClient,
    private gncservice: GncService
    ) {}

  getAllPrograms(): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.URL}/programs`).pipe(
      tap(_ => this.log(`fetched programs`)),
      catchError(this.handleError('getAllPrograms', []))
    );
  }

  getProgram(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.URL}/programs/${id}`).pipe(
      tap(_ => this.log(`fetched program ${id}`)),
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
