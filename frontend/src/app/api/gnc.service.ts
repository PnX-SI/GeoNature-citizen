// angular
import { Injectable } from '@angular/core';
// config
import { MainConfig } from '../../conf/main.config';
// models

@Injectable({
    providedIn: 'root',
})
export class GncService {
    private readonly URL = MainConfig.API_ENDPOINT;

    constructor() {}
}
