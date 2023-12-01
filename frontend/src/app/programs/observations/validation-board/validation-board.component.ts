import { Component, LOCALE_ID, Inject, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

import { ObservationsService } from '../observations.service';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

@Component({
    selector: 'validation-board',
    templateUrl: './validation-board.component.html',
    styleUrls: [
        '../../../auth/user-dashboard/user-dashboard.component.css',
        './validation-board.component.css'
    ],
})
export class ValidationBoardComponent implements OnInit {
    observations: any;
    invalidationStatuses: any;
    selectedInvalidationStatus: any;

    constructor(
        private observationsService: ObservationsService,
        @Inject(LOCALE_ID) readonly localeId: string,
        private userService: UserService,
    ) {}

    ngOnInit() {
        this.userService.getInvalidationStatuses().subscribe((statuses) => {
            this.invalidationStatuses = statuses
            this.selectedInvalidationStatus = this.invalidationStatuses[0].value;

        })
    }

    ngAfterViewInit() {
        const data = [];
        this.observations = null;
        const notValidatedObservations = this.observationsService.getNotValidatedObservations();
        data.push(notValidatedObservations);
        forkJoin(data).subscribe((data: any) => {
            this.observations = data[0];
        });
    }
}
