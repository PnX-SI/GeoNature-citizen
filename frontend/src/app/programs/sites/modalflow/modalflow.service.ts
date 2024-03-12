import { Injectable } from '@angular/core';

import { FlowItem } from '../../observations/modalflow/flow/flow-item';
import { FlowComponent } from '../../observations/modalflow/flow/flow.component';
import { OnboardComponent } from '../../observations/modalflow/steps/onboard/onboard.component';
import { SiteStepComponent } from './steps/site/site_step.component';
import { VisitStepComponent } from './steps/visit/visit_step.component';
import { SiteCongratsComponent } from './steps/congrats/congrats.component';
import { ModalFlowService } from '../../observations/modalflow/modalflow.service';

@Injectable({
    providedIn: 'root',
})
export class SiteModalFlowService extends ModalFlowService {
    getFlowItems(init_data: any) {
        const items = [];
        items.push(
            new FlowItem(OnboardComponent, { ...init_data, service: this })
        );
        if (!init_data.site_id) {
            items.push(
                new FlowItem(SiteStepComponent, { ...init_data, service: this })
            );
            items.push(
                new FlowItem(SiteCongratsComponent, {
                    service: this,
                    date: new Date().toLocaleDateString(),
                })
            );
        }
        if (!init_data.updateData) {
            items.push(new FlowItem(VisitStepComponent), { ...init_data, service: this });
        } // else user only edits the site and do not attach visit
        // items.push(new FlowItem(RewardComponent, {service: this}));
        return items;
    }

    addSiteVisit(site_id) {
        const init_data = { site_id: site_id };
        this.openFormModal(init_data);
    }

    editSiteVisit (site_id, visit_id, visit_data) {
        const init_data = {
            site_id: site_id,
            visit_id: visit_id,
            visit_data: visit_data
        };
        this.openFormModal(init_data);
    }

    openFormModal(init_data) {
        const flowitems = this.getFlowItems(init_data);
        const modalRef = this.open(FlowComponent);
        modalRef.componentInstance.flowItems = flowitems;
    }
}
