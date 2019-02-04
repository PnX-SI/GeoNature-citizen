import {
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

import { ModalFlowService } from './modalflow/modalflow.service'
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ObsComponent implements OnInit {
  title = 'Observations';
  survey_id: any;
  coords: any;

  constructor(
    private route: ActivatedRoute,
    public flowService: ModalFlowService,
  ) {
    this.route.params.subscribe(params => this.survey_id = params['id'])
  }

  ngOnInit() {
    console.debug('ObsComponent survey', this.survey_id);
  }
}
