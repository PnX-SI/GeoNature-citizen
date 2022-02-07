import { Injectable } from '@angular/core';

import { FlowItem } from '../../observations/modalflow/flow/flow-item';
import { FlowComponent } from '../../observations/modalflow/flow/flow.component';
import { OnboardComponent } from '../../observations/modalflow/steps/onboard/onboard.component';
import { AreaStepComponent } from './steps/area/area_step.component';
import { SpeciesSiteStepComponent } from './steps/species_site/species_site_step.component';
import { SpeciesSiteObsStepComponent } from './steps/observation/species_site_obs_step.component';
import { AreaCongratsComponent } from './steps/congrats/congrats.component';
import { RewardComponent } from '../../observations/modalflow/steps/reward/reward.component';
import { ModalFlowService } from '../../observations/modalflow/modalflow.service';

@Injectable({
    providedIn: 'root',
})
export class AreaModalFlowService extends ModalFlowService {
    getFlowItems(init_data: any) {
        const items = [];
        items.push(
            new FlowItem(OnboardComponent, { ...init_data, service: this })
        );
        if (
            !init_data.area_id &&
            !init_data.species_site_id &&
            !init_data.speciesSiteUpdateData &&
            !init_data.obsUpdateData
        ) {
            items.push(
                new FlowItem(AreaStepComponent, { ...init_data, service: this })
            );
            items.push(
                new FlowItem(AreaCongratsComponent, {
                    service: this,
                    date: new Date().toLocaleDateString(),
                })
            );
        }
        if (
            !init_data.updateData &&
            !init_data.obsUpdateData &&
            !init_data.species_site_id
        ) {
            items.push(
                new FlowItem(SpeciesSiteStepComponent, { service: this })
            );
        }

        if (!init_data.updateData && !init_data.speciesSiteUpdateData) {
            items.push(new FlowItem(SpeciesSiteObsStepComponent));
        }

        items.push(new FlowItem(RewardComponent, { service: this }));
        return items;
    }

    addAreaSpeciesSite(area_id, species = null) {
        const init_data = { area_id: area_id, species: species };
        this.openFormModal(init_data);
    }

    addSpeciesSiteObservation(
        species_site_id,
        options: { id_species_stage?; observation? } = {}
    ) {
        const init_data = {
            species_site_id: species_site_id,
            id_species_stage: options.id_species_stage,
            obsUpdateData: options.observation,
        };
        this.openFormModal(init_data);
    }

    openFormModal(init_data) {
        const flowitems = this.getFlowItems(init_data);
        const modalRef = this.open(FlowComponent);
        modalRef.componentInstance.flowItems = flowitems;
    }
}
