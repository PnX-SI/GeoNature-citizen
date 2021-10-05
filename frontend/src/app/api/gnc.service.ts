// angular
import { Injectable } from '@angular/core';
// config
import { AppConfig } from '../../conf/app.config';
// models

@Injectable({
    providedIn: 'root',
})
export class GncService {
    private readonly URL = AppConfig.API_ENDPOINT;

    constructor() {}
}
