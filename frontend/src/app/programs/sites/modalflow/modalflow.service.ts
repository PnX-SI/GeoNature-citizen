import { Injectable } from '@angular/core';

import { FlowItem } from '../../observations/modalflow/flow/flow-item'
import { FlowComponent } from '../../observations/modalflow/flow/flow.component'
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

  getFlowItems(init_data: any) {
    let items = [];
    items.push(new FlowItem(OnboardComponent, { ...init_data, service: this }));
    if (!init_data.site_id) {
      items.push(new FlowItem(SiteStepComponent, { ...init_data, service: this }));
    }
    items.push(new FlowItem(VisitStepComponent));
    // items.push(new FlowItem(CongratsComponent, {service: this, date: new Date().toLocaleDateString()}));
    // items.push(new FlowItem(RewardComponent, {service: this}));
    return items;
  }

  addSite(program_id) {
    var init_data = { program_id: program_id };
    var flowitems = this.getFlowItems(init_data);
    var modalRef = this.open(FlowComponent);
    modalRef.componentInstance.flowItems = flowitems;
  }

  addSiteVisit(site_id) {
    var init_data = { site_id: site_id };
    var flowitems = this.getFlowItems(init_data);
    var modalRef = this.open(FlowComponent);
    modalRef.componentInstance.flowItems = flowitems;
  }
}
