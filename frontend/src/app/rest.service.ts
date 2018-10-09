import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from "@angular/common/http";
import { map } from "rxjs/operators";

const apiUrl = "http://localhost:5001/api/";
const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" })
};

@Injectable()
export class RestService {
  constructor(private http: HttpClient) {}

  getSightsItems() {
    return this.http.get(apiUrl + "sights").pipe(map(data => data));
  }

  // getSight(id): Observable<any> {
  //   return this.http.get(apiUrl + 'sights/' + id);
  // }

  // postSight (sight): Observable<any> {
  //   console.log(sight);
  //   return this.http.post<any>(apiUrl + 'products', JSON.stringify(sight), httpOptions).pipe(
  //     tap((sight) => console.log(`added sight w/ id=${sight.id}`)),
  //     catchError(this.handleError<any>('postSight'))
  //   );
  // }

  // private handleError<T> (operation = 'operation', result?: T) {
  //   return (error: any): Observable<T> => {

  //     // TODO: send the error to remote logging infrastructure
  //     console.error(error); // log to console instead

  //     // TODO: better job of transforming error for user consumption
  //     console.log(`${operation} failed: ${error.message}`);

  //     // Let the app keep running by returning an empty result.
  //     return of(result as T);
  //   };
  // }
}
