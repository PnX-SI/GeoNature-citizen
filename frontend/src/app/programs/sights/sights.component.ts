import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

declare let $: any;

@Component({
  selector: 'app-sights',
  templateUrl: './sights.component.html',
  styleUrls: ['./sights.component.css']
})
export class SightsComponent implements OnInit {
  title = 'Observations';
  survey_id: any;
  coords: any;


  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'];
    });
  }

  modal(content) {
    this.modalService.open(content, {});
  }

  ngOnInit() {
    console.log('PARAMS', this.survey_id);
  }

}
