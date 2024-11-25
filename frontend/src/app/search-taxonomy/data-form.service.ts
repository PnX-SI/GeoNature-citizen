import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MainConfig } from '../../conf/main.config';
import { Taxref } from '../programs/observations/observation.model';
/** Interface for queryString parameters*/
export interface ParamsDict {
    [key: string]: string;
}

@Injectable()
export class DataFormService {
    public config = MainConfig;

    constructor(private _http: HttpClient) {}

    autocompleteTaxon(
        api_endpoint: string,
        searh_name: string,
        params?: ParamsDict
    ) {
        let queryString: HttpParams = new HttpParams();
        queryString = queryString.set('search_name', searh_name);
        for (const key in params) {
            if (params[key]) {
                queryString = queryString.set(key, params[key]);
            }
        }
        return this._http.get<Taxref[]>(`${api_endpoint}`, {
            params: queryString,
        });
    }

    getRegneAndGroup2Inpn() {
        return this._http.get<any>(
            `${this.config.API_TAXHUB}/taxref/regnewithgroupe2`
        );
    }
}
