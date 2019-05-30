import { Injectable, EventEmitter, Output } from '@angular/core';

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
  @Output() siteVisitClick: EventEmitter<number> = new EventEmitter();

  getFlowItems(site_id?: number) {
    let init_data = site_id ? { site_id: site_id } : {}
    let items = [];
    items.push(new FlowItem(OnboardComponent, { ...init_data, service: this }));
    if (!site_id) {
      items.push(new FlowItem(SiteStepComponent));
    }
    items.push(new FlowItem(VisitStepComponent));
    // items.push(new FlowItem(CongratsComponent, {service: this, date: new Date().toLocaleDateString()}));
    // items.push(new FlowItem(RewardComponent, {service: this}));
    return items;
  }

  addSiteVisit(site_id) {
    this.siteVisitClick.emit(site_id);
  }
}
