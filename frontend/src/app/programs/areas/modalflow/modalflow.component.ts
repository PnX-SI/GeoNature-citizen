import {
    Component,
    ViewEncapsulation,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FlowItem } from '../../observations/modalflow/flow/flow-item';
import { AreaModalFlowService } from './modalflow.service';
import { FlowComponent } from '../../observations/modalflow/flow/flow.component';

@Component({
    selector: 'app-areamodalflow',
    templateUrl: '../../observations/modalflow/modalflow.component.html',
    styleUrls: ['../../observations/modalflow/modalflow.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AreaModalFlowComponent {
    @Input('coords') coords;
    @Input('modalversion') modalversion = true;
    @ViewChild('content', { static: true }) content: ElementRef;
    @Input('updateData') updateData;
    @Input('admin') admin;
    @Input('speciesSiteUpdateData') speciesSiteUpdateData;
    @Input('obsUpdateData') obsUpdateData;
    @Input('program_id') program_id;
    flowitems: FlowItem[];
    timeout: any;

    constructor(
        public flowService: AreaModalFlowService,
        private route: ActivatedRoute
    ) {}

    clicked() {
        this.flowitems = this.flowService.getFlowItems({
            program_id: this.program_id,
            coords: this.coords,
            updateData: this.updateData,
            speciesSiteUpdateData: this.speciesSiteUpdateData,
            obsUpdateData: this.obsUpdateData,
            admin: this.admin,
        });
        if (this.modalversion) {
            const modalRef = this.flowService.open(this.content);
        } else {
            this.flowService.toggleDisplay();
        }
    }

    ngOnDestroy(): void {
        console.debug('destroyed');
    }

    step(componentName) {}
}
