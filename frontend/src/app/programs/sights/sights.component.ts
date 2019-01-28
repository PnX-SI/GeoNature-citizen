import {
  Component,
  OnInit,
  // ViewChild,
  // ElementRef,
  ViewEncapsulation,
  // OnDestroy
} from '@angular/core';

// import { FlowItem } from '../../flow/flow-item'
import { ModalFlowService } from './modalflow/modalflow.service'
import { ActivatedRoute } from '@angular/router';
// import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
// import { LoginComponent } from "../../auth/login/login.component";
// import { RegisterComponent } from "../../auth/register/register.component";

@Component({
  selector: 'app-sights',
  templateUrl: './sights.component.html',
  styleUrls: ['./sights.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SightsComponent implements OnInit {
  title = 'Observations';
  survey_id: any;
  coords: any;

  constructor(
    private route: ActivatedRoute,
    public flowService: ModalFlowService,
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'] || 1;
    });
  }


  ngOnInit() {
    console.log('PARAMS', this.survey_id);
  }
  //
  // login() {
  //   // if not user_logged_in
  //   this.modalService.open(LoginComponent);
  // }
  //
  // register() {
  //   this.modalService.open(RegisterComponent);
  // }
}
