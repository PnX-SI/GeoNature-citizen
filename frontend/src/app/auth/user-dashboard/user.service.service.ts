import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AppConfig } from "../../../conf/app.config";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class UseService {
 
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  constructor(private http: HttpClient) {}

  getPersonalInfo() {
    let url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get(url, { headers: this.headers });
  }

  getBadgeCategories(userId: number) {
    return this.http.get<Object>(`${AppConfig.API_ENDPOINT}/rewards/${userId}`);
  }

  updatePersonalData(personalInfo) {
    console.log('up',personalInfo);
    
    return this.http
      .patch(`${AppConfig.API_ENDPOINT}/user/info`, personalInfo, {
        headers: this.headers
      })
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }

  getObservationsByUserId(userId: number) {
    return this.http.get<Object>(
      `${AppConfig.API_ENDPOINT}/observations/users/${userId}`
    );
  }

  deleteObsservation(idObs: any) {
    return this.http.delete<Object>(`${AppConfig.API_ENDPOINT}/observations/${idObs}`);
  }

  ConvertToCSV(objArray, headerList) {
    let array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
    let str = "";
    let row = "";
    for (let index in headerList) {
      row += headerList[index] + ";";
    }
    row = row.slice(0, -1);
    str += row + "\r\n";
    for (let i = 0; i < array.length; i++) {
      let line ="" ;
      for (let index in headerList) {
        let head = headerList[index];
        line += ";" + array[i][head];
      }
      line = line.slice(1);
      str += line + "\r\n";
    }
    return str;
  }
}
