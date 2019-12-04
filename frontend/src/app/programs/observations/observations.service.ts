import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../../conf/app.config";

@Injectable({
  providedIn: "root"
})
export class ObservationsService {
  constructor(private http: HttpClient) {}

  updateObservation(formData) {
    let url = `${AppConfig.API_ENDPOINT}/observations`;
    return this.http.patch(url,formData);
  }

  postObservation(formData) {
    let url = `${AppConfig.API_ENDPOINT}/observations`;
    return this.http.post(url, formData);
  }

  getStat(){
    let url = `${AppConfig.API_ENDPOINT}/stats`;
    return this.http.get(url);
  }
}
