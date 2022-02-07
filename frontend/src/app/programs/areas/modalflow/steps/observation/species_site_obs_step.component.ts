import { Component, Inject, Input, LOCALE_ID, ViewChild } from '@angular/core';

import { IFlowComponent } from '../../../../observations/modalflow/flow/flow';
import { SpeciesSiteObservationFormComponent } from '../../../observations/observation_form/form.component';
import { Router } from '@angular/router';
import { AreaService } from '../../../areas.service';

@Component({
    templateUrl: './species_site_obs_step.component.html',
    styleUrls: ['./species_site_obs_step.component.css'],
    // encapsulation: ViewEncapsulation.None
})
export class SpeciesSiteObsStepComponent implements IFlowComponent {
    @Input() data: any;
    @ViewChild(SpeciesSiteObservationFormComponent, { static: true })
    form: SpeciesSiteObservationFormComponent;
    program_id: number;
    loading = false;

    constructor(private router: Router, private areaService: AreaService) {}

    committedAndShowObs() {
        this.loading = true;
        this.form.onFormSubmit().subscribe(
            function (result) {
                this.loading = false;
                if (result) {
                    if (result.features) {
                        this.areaService.newSpeciesSiteObsCreated.emit(
                            result.features[0]
                        );
                    } else {
                        this.areaService.speciesSiteObsEdited.emit();
                    }
                    this.closeModal();
                    this.router.navigate([
                        `/programs/${result.features[0].program_id}/areas-observations`,
                    ]);
                }
            }.bind(this)
        );
    }

    committed() {
        this.loading = true;
        this.form.onFormSubmit().subscribe(
            function (result) {
                this.loading = false;
                if (result) {
                    if (result.features) {
                        console.debug('committed action > data:', this.data);
                        this.areaService.newSpeciesSiteObsCreated.emit(
                            result.features[0]
                        );
                    } else {
                        this.areaService.speciesSiteObsEdited.emit();
                    }
                    this.closeModal();
                }
            }.bind(this)
        );
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
