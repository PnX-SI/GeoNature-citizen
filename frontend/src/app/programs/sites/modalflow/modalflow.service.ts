import { Injectable } from '@angular/core';

// import {
//   NgbModal,
//   ModalDismissReasons,
//   NgbModalRef,
//   NgbModalOptions,
// } from '@ng-bootstrap/ng-bootstrap'

import { FlowItem } from '../../observations/modalflow/flow/flow-item'
import { OnboardComponent } from '../../observations/modalflow/steps/onboard/onboard.component'
import { SiteStepComponent } from "./steps/site/site_step.component";
import { VisitStepComponent } from './steps/visit/visit_step.component'
import { CongratsComponent } from '../../observations/modalflow/steps/congrats/congrats.component'
import { RewardComponent } from '../../observations/modalflow/steps/reward/reward.component';
import { ModalFlowService } from '../../observations/modalflow/modalflow.service'


@Injectable({
  providedIn: 'root'
})
export class SiteModalFlowService extends ModalFlowService {
  getFlowItems(site_id?: number) {
    return [
      new FlowItem(OnboardComponent, {service: this}),
      new FlowItem(SiteStepComponent, {service: this }),
      new FlowItem(VisitStepComponent, {service: this }),
      new FlowItem(CongratsComponent, {service: this, date: new Date().toLocaleDateString()}),
      new FlowItem(RewardComponent, {service: this}),
    ]
  }
}
