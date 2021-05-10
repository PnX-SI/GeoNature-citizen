import {
    Component,
    OnInit,
    Input,
    ViewChild,
    ElementRef,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
} from '@angular/core';

import { FlowItem } from './flow/flow-item';
import { ModalFlowService } from './modalflow.service';
import { AppConfig } from '../../../../conf/app.config';

@Component({
    selector: 'app-modalflow',
    templateUrl: './modalflow.component.html',
    styleUrls: ['./modalflow.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class ModalFlowComponent implements OnInit {
    @Input('coords') coords;
    @Input('program_id') program_id;
    @Input('registration_required') registration_required;
    @Input('form_message') form_message;
    @Input('default_image') default_image;
    @Input('updateData') updateData;
    @Input('modalversion') modalversion: boolean = true;
    @ViewChild('content', { static: true }) content: ElementRef;
    AppConfig = AppConfig;
    flowitems: FlowItem[];
    timeout: any;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        public flowService: ModalFlowService
    ) {}

    ngOnInit() {
        this.flowService.modalversion = this.modalversion;
    }

    clicked() {
        this.flowitems = this.flowService.getFlowItems({
            coords: this.coords,
            program_id: this.program_id,
            registration_required: this.registration_required,
            form_message: this.form_message,
            default_image: this.default_image,
            updateData: this.updateData,
        });
        if (this.modalversion) {
            this.flowService.open(this.content);
        } else {
            this.flowService.toggleDisplay();
        }
    }

    step(componentName) {}
}
