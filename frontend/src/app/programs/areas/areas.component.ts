import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ViewChildren,
    QueryList,
    Input,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FeatureCollection } from 'geojson';

import { GncProgramsService } from '../../api/gnc-programs.service';
import { Program } from '../programs.models';
import { AreaModalFlowService } from './modalflow/modalflow.service';
import { AreaService } from './areas.service';
import { AreasMapComponent } from '../../programs/areas/areas/map/areamap.component';
import { AreasListComponent } from './areas/list/list.component';
import { AreaModalFlowComponent } from './modalflow/modalflow.component';
import { ProgramBaseComponent } from '../base/program-base.component';
import { AuthService } from '../../auth/auth.service';
import { ModalsTopbarService } from '../../core/topbar/modalTopbar.service';

@Component({
    selector: 'app-areas',
    templateUrl: './areas.component.html',
    styleUrls: [
        '../observations/obs.component.css',
        '../../home/home.component.css',
        './areas.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AreasComponent extends ProgramBaseComponent implements OnInit {
    title = 'Areas';
    @Input('areas') areas: FeatureCollection;
    @Input('userDashboard') userDashboard = false;
    @Input('admin') admin = false;
    @ViewChild(AreasMapComponent, { static: true }) areasMap: AreasMapComponent;
    @ViewChild(AreasListComponent, { static: true })
    areasList: AreasListComponent;
    @ViewChildren(AreaModalFlowComponent)
    modalFlow: QueryList<AreaModalFlowComponent>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        public flowService: AreaModalFlowService,
        public areaService: AreaService,
        protected modalService: ModalsTopbarService,
        authService: AuthService
    ) {
        super(authService);

        this.route.params.subscribe(
            (params) => (this.program_id = params['id'])
        );
        this.route.fragment.subscribe((fragment) => {
            this.fragment = fragment;
        });
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

            this.programService
                .getProgram(this.program_id)
                .subscribe((program) => (this.programFeature = program));

            this.loadData();
        });
        this.areaService.newAreaCreated.subscribe(this.loadData.bind(this));
        this.areaService.areaEdited.subscribe(this.loadData.bind(this));
        this.areaService.areaDeleted.subscribe(this.loadData.bind(this));
    }

    ngAfterViewInit() {
        this.verifyProgramPrivacyAndUser();
    }

    loadData() {
        if (!this.program_id) {
            return;
        }
        this.programService
            .getProgramAreas(this.program_id)
            .subscribe((areas) => {
                this.areas = areas;
            });
    }

    addAreaClicked() {
        this.modalFlow.first.clicked();
    }
}
