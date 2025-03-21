import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MainConfig } from '../../../conf/main.config';
import { Stats, ObservationFeatureCollection } from './observation.model';
@Injectable({
    providedIn: 'root',
})
export class ObservationsService {
    constructor(private http: HttpClient) {}

    updateObservation(formData): Observable<ObservationFeatureCollection> {
        const url = `${MainConfig.API_ENDPOINT}/observations`;
        return this.http.patch<ObservationFeatureCollection>(url, formData);
    }

    postObservation(formData): Observable<ObservationFeatureCollection> {
        const url = `${MainConfig.API_ENDPOINT}/observations`;
        return this.http.post<ObservationFeatureCollection>(url, formData);
    }

    getStat(): Observable<Stats> {
        const url = `${MainConfig.API_ENDPOINT}/stats`;
        return this.http.get<Stats>(url);
    }

    getNotValidatedObservations(): Observable<ObservationFeatureCollection> {
        const params = {
            validation_process: 'true',
            validation_status__notequal: 'VALIDATED',
        };
        const url = `${MainConfig.API_ENDPOINT}/observations`;
        return this.http.get<ObservationFeatureCollection>(url, { params });
    }

    getObservation(
        observationId: number
    ): Observable<ObservationFeatureCollection> {
        return this.http.get<ObservationFeatureCollection>(
            `${MainConfig.API_ENDPOINT}/observations/${observationId}`
        );
    }
}
