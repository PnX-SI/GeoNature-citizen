import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {map} from 'rxjs/operators';
import {AppConfig} from '../../../../conf/app.config';

@Component({
  selector: 'app-sight-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class SightsListComponent implements OnInit {
  survey_id: any;
  sightsFeatures: any;


  constructor(
    // private rest: RestService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'];
    });
  }

  ngOnInit() {
    this.getSightsFeatures();
  }

  getSightsFeatures(): void {
    this.restItemsServiceGetSightsItems().subscribe(sights => {
      this.sightsFeatures = sights['features'];
    });
  }

  restItemsServiceGetSightsItems() {
    return this.http.get(`${AppConfig.API_ENDPOINT}/sights`).pipe(map(data => data));
  }

}
