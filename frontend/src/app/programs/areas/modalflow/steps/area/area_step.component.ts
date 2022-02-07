import { Component, Input, ViewChild } from '@angular/core';

import { IFlowComponent } from '../../../../observations/modalflow/flow/flow';
import { AreaFormComponent } from '../../../areas/areaform/areaform.component';
import { AreaService } from '../../../areas.service';

@Component({
    templateUrl: './area_step.component.html',
    styleUrls: ['./area_step.component.css'],
    // encapsulation: ViewEncapsulation.None
})
export class AreaStepComponent implements IFlowComponent {
    @Input() data: any;
    @ViewChild(AreaFormComponent, { static: true }) form: AreaFormComponent;
    closeAfterSending = false;

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
        let resp: any;
        resp = this.form.onFormSubmit();
        console.debug('committed action > data:', this.data);
        // Wait for resolution of http promise "resp"
        // to get new created area's id and pass it to next step as extra_data
        resp.then(
            function (result) {
                if (result.features) {
                    // Area created
                    const area_id = result.features[0].properties.id_area;
                    this.areaService.newAreaCreated.emit(result.features[0]);
                    this.data.next({ ...this.data, area_id: area_id });
                    if (this.closeAfterSending) {
                        this.closeModal();
                    }
                } else {
                    // Area edited
                    this.data.next(this.data);
                    this.areaService.areaEdited.emit();
                    this.closeModal();
                }
            }.bind(this)
        );
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
