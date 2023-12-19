import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ViewChildren,
    QueryList,
    HostListener,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { forkJoin, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { FeatureCollection, Feature } from 'geojson';

import { Program } from '../programs.models';
import { ProgramsResolve } from '../../programs/programs-resolve.service';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { ModalFlowService } from './modalflow/modalflow.service';
import { TaxonomyList } from './observation.model';
import { ObsMapComponent } from './map/map.component';
import { ObsListComponent } from './list/list.component';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { ProgramBaseComponent } from '../base/program-base.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../auth/user-dashboard/user.service.service';
import { ObservationsService } from './observations.service';
import { MainConfig } from '../../../conf/main.config';

@Component({
    selector: 'app-observations',
    templateUrl: './obs.component.html',
    styleUrls: ['./obs.component.css', '../../home/home.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [ProgramsResolve],
})
export class ObsComponent extends ProgramBaseComponent implements OnInit {
    observations: FeatureCollection;
    surveySpecies: TaxonomyList;
    @ViewChild(ObsMapComponent, { static: true }) obsMap: ObsMapComponent;
    @ViewChild(ObsListComponent, { static: true }) obsList: ObsListComponent;
    @ViewChildren(ModalFlowComponent) modalFlow: QueryList<ModalFlowComponent>;

    selectedObs: Feature;
    public isCollapsed = true;
    isMobile: boolean;
    hideProgramHeader = false;
    obsToValidate: Feature;
    modalRef: NgbModalRef;
    role_id: number;
    isValidator: boolean = false;
    username: string = null;
    userObservations: FeatureCollection;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private route: ActivatedRoute,
        private router: Router,
        private programService: GncProgramsService,
        public flowService: ModalFlowService,
        public breakpointObserver: BreakpointObserver,
        private titleService: Title,
        private metaTagService: Meta,
        public auth: AuthService,
        public userService: UserService,
        private modalService: NgbModal,
        private observationsService: ObservationsService,
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.program_id = params['id'];
            this.flowService.closeModal(); // Avoid keeping another program's form open
        });
        this.route.fragment.subscribe((fragment) => {
            this.fragment = fragment;
        });
        this.route.queryParams.subscribe((params) => {
            this.hideProgramHeader = 'hideProgramHeader' in params;
        });
    }

    ngOnInit(): void {
        this.breakpointObserver
            .observe(['(min-width: 700px)'])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this.isMobile = false;
                } else {
                    this.isMobile = true;
                }
            });

        this.route.data.subscribe((data: { programs: Program[] }) => {
            this.programs = data.programs;
            this.program = this.programs.find(
                (p) => p.id_program == this.program_id
            );
            this.taxonomyListID = this.program.taxonomy_list;
            forkJoin([
                this.programService.getProgramObservations(this.program_id),
                this.programService.getProgramTaxonomyList(
                    this.program.taxonomy_list
                ),
                this.programService.getProgram(this.program_id),
            ]).subscribe(([observations, taxa, program]) => {
                this.observations = observations;
                this.surveySpecies = taxa;
                this.programFeature = program;
            });
            this.titleService.setTitle(
                this.MainConfig.appName + ' - ' + this.program.title
            );
            this.metaTagService.updateTag({
                name: 'description',
                content: this.program.short_desc,
            });
            this.metaTagService.updateTag({
                property: 'og:title',
                content: MainConfig.appName + ' - ' + this.program.title,
            });
            this.metaTagService.updateTag({
                property: 'og:description',
                content: this.program.short_desc,
            });
            this.metaTagService.updateTag({
                property: 'og:image',
                content: this.program.image,
            });
            this.metaTagService.updateTag({
                property: 'og:url',
                content: MainConfig.URL_APPLICATION + this.router.url,
            });
            this.metaTagService.updateTag({
                property: 'twitter:title',
                content: MainConfig.appName + ' - ' + this.program.title,
            });
            this.metaTagService.updateTag({
                property: 'twitter:description',
                content: this.program.short_desc,
            });
            this.metaTagService.updateTag({
                property: 'twitter:image',
                content: this.program.image,
            });
        });

        const access_token = localStorage.getItem('access_token');
        if (access_token) {
            this.auth
                .ensureAuthorized()
                .subscribe((user) => {
                    if (
                        user &&
                        user['features'] &&
                        user['features']['id_role']
                    ) {
                        this.isValidator = user["features"]["validator"]

                    }
                });
        }
        this.username = localStorage.getItem('username');

        if (access_token) {
            this.auth
                .ensureAuthorized()
                .pipe(
                    tap((user) => {
                        if (
                            user &&
                            user['features'] &&
                            user['features']['id_role']
                        ) {
                            this.role_id = user['features']['id_role'];
                        }
                    }),
                    catchError((err) => throwError(err))
                )
                .subscribe((user) => {
                    this.isValidator = user["features"]["validator"]
                    this.userService.getObservationsByUserId(
                        this.role_id
                    ).subscribe((userObservations: FeatureCollection) => {
                        this.userObservations = userObservations
                    });
                });
        }
    }

    @HostListener('document:NewObservationEvent', ['$event'])
    newObservationEventHandler(e: CustomEvent): void {
        e.stopPropagation();

        this.observations.features.unshift(e.detail);
        this.observations = {
            type: 'FeatureCollection',
            features: this.observations.features,
        };
    }

    // @HostListener("document:ObservationFilterEvent", ["$event"])
    // observationFilterEventHandler(e: CustomEvent) {
    // e.stopPropagation();
    // console.log("FOURTR", this.obsList)
    // this.obsList.observations = {
    // type: "FeatureCollection",
    // features: this.observations.features
    // };
    // }

    addObsClicked() {
        this.modalFlow.first.clicked();
    }

    openValidateModal(validateModal: any, idObs: number) {
        this.obsToValidate = this.observations.features.find(obs => obs.properties.id_observation === idObs);
        if (this.canValidateObservation()) {
            this.modalRef = this.modalService.open(validateModal, {
                size: 'lg',
                windowClass: 'obs-modal',
                centered: true,
            });
        }
    }

    canValidateObservation(): boolean {
        return this.isValidator && this.obsToValidate.properties.validation_status != "VALIDATED" && this.obsToValidate.properties.observer.username !== this.username
    }

    closeModal(observationId: number = null) {
        if (observationId) {
            this.route.data.subscribe(() => {
                this.observationsService
                .getObservation(observationId)
                .subscribe((updatedObservation: FeatureCollection) => {
                    this.observations.features[this.observations.features.findIndex(obs => obs.properties.id_observation === observationId)] = updatedObservation.features[0]
                });
            });
        }
        this.modalRef.close();
    }

    ngOnDestroy(): void {
        if (this.modalRef) this.modalRef.close();
    }
}
