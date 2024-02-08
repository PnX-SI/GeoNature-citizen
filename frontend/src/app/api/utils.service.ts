// angular
import { Injectable } from '@angular/core';
// config
import { MainConfig } from '../../conf/main.config';
// models
export const objectCleaner = obj => {
    Object.keys(obj).forEach(key => (obj[key] == null || obj[key] == undefined) && delete obj[key]);
    return obj
};

@Injectable({
    providedIn: 'root',
})
export class UtilsService {
    // private readonly URL = MainConfig.API_ENDPOINT;

    constructor() {
    }
}
