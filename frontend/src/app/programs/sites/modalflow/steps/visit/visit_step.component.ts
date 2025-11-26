import {
    Component,
    Input,
    ViewChild,
} from '@angular/core';

import { IFlowComponent } from '../../../../observations/modalflow/flow/flow';
import { SiteVisitFormComponent } from '../../../form/form.component';

@Component({
    templateUrl: './visit_step.component.html',
    styleUrls: ['./visit_step.component.css'],
    // encapsulation: ViewEncapsulation.None
})
export class VisitStepComponent implements IFlowComponent {
    @Input() data: any;
    @ViewChild(SiteVisitFormComponent, { static: true })
    form: SiteVisitFormComponent;

    committed() {
        this.form.onFormSubmit();
        // this.data.next();
        this.data.service.setModalCloseSatus('visitPosted');
        this.data.service.close(null);
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
