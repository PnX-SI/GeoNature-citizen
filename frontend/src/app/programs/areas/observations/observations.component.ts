import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ViewChildren,
    QueryList,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { GncProgramsService } from '../../../api/gnc-programs.service';
import { AreaModalFlowService } from '../modalflow/modalflow.service';
import { AreaService } from '../areas.service';
import { SpeciesSitesObsListComponent } from './list/list.component';
import { ProgramBaseComponent } from '../../base/program-base.component';
import { AuthService } from '../../../auth/auth.service';
import { Program } from '../../programs.models';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

@Component({
    selector: 'app-species-sites-obs',
    templateUrl: './observations.component.html',
    styleUrls: [
        '../../observations/obs.component.css',
        '../../../home/home.component.css',
        './observations.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSitesObsComponent
    extends ProgramBaseComponent
    implements OnInit
{
    title = 'Observations';
    @Input('observations') observations;
    @Input('admin') admin = false;
    @Input('userDashboard') userDashboard = false;
    @Output() refreshListEvent = new EventEmitter<string>();
    @ViewChild(SpeciesSitesObsListComponent, { static: true })
    observationsList: SpeciesSitesObsListComponent;
    previousPageData;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        public flowService: AreaModalFlowService,
        public areaService: AreaService,
        private userService: UserService,
        authService: AuthService
    ) {
        super(authService);
        this.route.fragment.subscribe((fragment) => {
            this.fragment = fragment;
        });
        this.route.params.subscribe((params) => {
            this.program_id = params['program_id'];
        });
    }

    refreshList(event) {
        if (this.userDashboard) {
            this.refreshListEvent.emit(event);
        } else {
            let data = { page: 0, pageSize: 0 };
            if (event) {
                try {
                    data = JSON.parse(event);
                } catch (e) {
                    console.log('non valid json data', event, e);
                }
            }
            this.previousPageData = data;
            this.loadData(data);
        }
    }

    ngOnInit() {
        this.route.data.subscribe((data: { programs: Program[] }) => {
            if (this.userDashboard) {
                return;
            }
            this.programs = data.programs;
            this.program = this.programs.find(
                (p) => p.id_program == this.program_id
            );

            this.areaService.speciesSiteObsEdited.subscribe(
                this.loadData.bind(this)
            );
            this.areaService.speciesSiteObsDeleted.subscribe(
                this.loadData.bind(this)
            );
        });
    }

    ngAfterViewInit() {
        this.verifyProgramPrivacyAndUser();
    }

    loadData(pageData = null) {
        if (!pageData) {
            pageData = this.previousPageData
                ? this.previousPageData
                : { page: 0, pageSize: 0 };
        }
        this.programService
            .getProgramSpeciesSitesObservations(
                this.program_id,
                pageData.page,
                pageData.pageSize
            )
            .subscribe((observations) => {
                this.observations = observations;
            });
    }

    onExportAreas() {
        this.userService.exportAreas();
    }
}
