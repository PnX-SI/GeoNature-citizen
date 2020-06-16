import { Injectable, EventEmitter, Output } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class SiteService {

  @Output() newSiteCreated: EventEmitter<any> = new EventEmitter();

}
