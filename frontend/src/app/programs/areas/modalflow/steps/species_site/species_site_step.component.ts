import { Component, Input, ViewChild } from '@angular/core';

import { IFlowComponent } from '../../../../observations/modalflow/flow/flow';
import { SpeciesSiteFormComponent } from '../../../species_sites/species_site_form/species_site_form.component';
import { AreaService } from '../../../areas.service';

@Component({
    templateUrl: './species_site_step.component.html',
    styleUrls: ['./species_site_step.component.css'],
    // encapsulation: ViewEncapsulation.None
})
export class SpeciesSiteStepComponent implements IFlowComponent {
    @Input() data: any;
    @ViewChild(SpeciesSiteFormComponent, { static: true })
    form: SpeciesSiteFormComponent;
    closeAfterSending = false;
    loading = false;

    constructor(public areaService: AreaService) {}

    committedThenClose() {
        this.closeAfterSending = true;
        this.sendForm();
    }

    committed() {
        this.closeAfterSending = false;
        this.sendForm();
    }

    sendForm() {
        this.loading = true;

        console.debug('committed action > data:', this.data);

        const resp = this.form.onFormSubmit();
        // Wait for resolution of http promise "resp"
        // to get new created species_site's id and pass it to next step as extra_data
        resp.then(
            function (result) {
                this.loading = false;
                if (result.features) {
                    // SpeciesSite created
                    this.areaService.newSpeciesSiteCreated.emit(
                        result.features[0]
                    );

                    // this.data.next({
                    //     area_id: this.data.area_id,
                    // });
                    this.closeModal();
                    if (!this.closeAfterSending) {
                        this.data.service.addAreaSpeciesSite(this.data.area_id);
                    }
                } else {
                    // SpeciesSite edited
                    this.data.next(this.data);
                    this.areaService.speciesSiteEdited.emit();
                    this.closeModal();
                }
            }.bind(this)
        );
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
