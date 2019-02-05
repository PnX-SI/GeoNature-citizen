import {
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

import { ModalFlowService } from './modalflow/modalflow.service'
import { ActivatedRoute } from '@angular/router';
import { Program } from '../programs.models';

@Component({
  selector: 'app-observations',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css', '../../home/home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ObsComponent implements OnInit {
  title = 'Observations';
  survey_id: any;
  coords: any;
  programs: Program[]
  program: Program

  constructor(
    private route: ActivatedRoute,
    public flowService: ModalFlowService,
  ) {
    this.route.params.subscribe(params => this.survey_id = params['id'])
  }

  ngOnInit() {
    this.route.data
      .subscribe((data: { programs: Program[] }) => {
        this.programs = data.programs
        this.program = this.programs.find(p => p.id_program == this.survey_id)
    })
  }
}
