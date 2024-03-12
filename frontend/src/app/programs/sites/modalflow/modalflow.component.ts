import {
    Component,
    ViewEncapsulation,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlowItem } from '../../observations/modalflow/flow/flow-item';
import { SiteModalFlowService } from './modalflow.service';

@Component({
    selector: 'app-sitemodalflow',
    templateUrl: '../../observations/modalflow/modalflow.component.html',
    styleUrls: ['../../observations/modalflow/modalflow.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SiteModalFlowComponent {
    @Input('coords') coords;
    @Input('modalversion') modalversion: boolean = true;
    @ViewChild('content', { static: true }) content: ElementRef;
    @Input('updateData') updateData;
    @Input('program_id') program_id;
    @Input('registration_required') registration_required;
    flowitems: FlowItem[];
    timeout: any;

    constructor(
        public flowService: SiteModalFlowService,
        private route: ActivatedRoute
    ) {}

    clicked() {
        // this.flowService.openFormModal({ program_id: this.program_id, coords: this.coords });
        this.flowitems = this.flowService.getFlowItems({
            program_id: this.program_id,
            registration_required: this.registration_required,
            coords: this.coords,
            updateData: this.updateData,
        });
        if (this.modalversion) {
            var modalRef = this.flowService.open(this.content);
        } else {
            this.flowService.toggleDisplay();
        }
    }

    ngOnDestroy(): void {
        console.debug('destroyed');
    }

    step(componentName) {}
}
