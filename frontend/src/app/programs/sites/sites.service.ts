import { Injectable, EventEmitter, Output } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class SiteService {
  @Output() newSiteCreated: EventEmitter<any> = new EventEmitter();
  @Output() siteEdited: EventEmitter<any> = new EventEmitter();
  @Output() deleteSite = new EventEmitter();
}
