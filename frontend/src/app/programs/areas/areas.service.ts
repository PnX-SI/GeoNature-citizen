import { Injectable, EventEmitter, Output } from '@angular/core';
import { MainConfig } from '../../../conf/main.config';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class AreaService {
    constructor(private http: HttpClient) {}

    @Output() newAreaCreated = new EventEmitter();
    @Output() areaEdited = new EventEmitter();
    @Output() areaDeleted = new EventEmitter();

    @Output() newSpeciesSiteCreated = new EventEmitter();
    @Output() speciesSiteEdited = new EventEmitter();
    @Output() speciesSiteDeleted = new EventEmitter();

    @Output() newSpeciesSiteObsCreated = new EventEmitter();
    @Output() speciesSiteObsEdited = new EventEmitter();
    @Output() speciesSiteObsDeleted = new EventEmitter();

    deleteArea(areaId) {
        return this.http.delete(`${MainConfig.API_ENDPOINT}/areas/${areaId}`);
    }
    deleteSpeciesSite(speciesSiteId) {
        return this.http.delete(
            `${MainConfig.API_ENDPOINT}/areas/species_sites/${speciesSiteId}`
        );
    }
    deleteObservation(observationId) {
        return this.http.delete(
            `${MainConfig.API_ENDPOINT}/areas/observations/${observationId}`
        );
    }
}
