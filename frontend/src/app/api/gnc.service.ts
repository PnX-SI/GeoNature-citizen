import { Observable, throwError ,  of } from "rxjs";
import { map, catchError } from "rxjs/operators";
// angular
import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
// config
import { AppConfig } from "../../conf/app.config";
// models
import { Program } from "../programs/programs.models";
import { HttpErrorResponse } from "@angular/common/http";

const API_URL = AppConfig.API_ENDPOINT;
@Injectable({
  providedIn: "root"
})
export class GncService {
  private readonly URL = AppConfig.API_ENDPOINT;

  constructor() {}


}
