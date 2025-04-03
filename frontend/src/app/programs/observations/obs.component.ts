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
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

import { Program } from '../programs.models';
import { ProgramsResolve } from '../../programs/programs-resolve.service';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { ModalFlowService } from './modalflow/modalflow.service';
import {
    ObservationFeature,
    ObservationPropertiesList,
    TaxonomyList,
} from './observation.model';
import { ObsMapComponent } from './map/map.component';
import { MediaGaleryComponent } from '../media-galery/media-galery.component';
import { ObsListComponent } from './list/list.component';
import { ModalFlowComponent } from './modalflow/modalflow.component';
import { ProgramBaseComponent } from '../base/program-base.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../auth/user-dashboard/user.service.service';
import { ObservationsService } from './observations.service';
import { ObservationFeatureCollection } from './observation.model';
import { MainConfig } from '../../../conf/main.config';

@Component({
    selector: 'app-observations',
    templateUrl: './obs.component.html',
    styleUrls: ['./obs.component.css', '../../home/home.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [ProgramsResolve],
})
export class ObsComponent extends ProgramBaseComponent implements OnInit {
    observations: ObservationFeatureCollection;
    observedSpeciesUniqueSorted: ObservationPropertiesList;
    surveySpecies: TaxonomyList;
    @ViewChild(ObsMapComponent, { static: true }) obsMap: ObsMapComponent;
    @ViewChild(ObsListComponent, { static: true }) obsList: ObsListComponent;
    @ViewChild(MediaGaleryComponent, { static: true })
    mediaGalery: MediaGaleryComponent;
    @ViewChildren(ModalFlowComponent) modalFlow: QueryList<ModalFlowComponent>;

    selectedObs: ObservationFeature;
    public isCollapsed = true;
    isMobile: boolean;
    hideProgramHeader = false;
    mediaPanel = false;
    obsToValidate: ObservationFeature;
    modalRef: NgbModalRef;
    role_id: number;
    isValidator = false;
    username: string = null;

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
        private observationsService: ObservationsService
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
        if (this.program_id) {
            this.route.data.subscribe((data: { programs: Program[] }) => {
                this.programs = data.programs;
                this.program = this.programs.find(
                    (p) => p.id_program == this.program_id
                );
                this.taxonomyListID = this.program.taxonomy_list;
                forkJoin([
                    this.programService.getProgramObservations(this.program_id),
                    this.programService.getProgram(this.program_id),
                ]).subscribe(([observations, program]) => {
                    this.observations = observations;
                    this.observedSpeciesUniqueSorted =
                        this.getUniqueSortedSpecies(this.observations.features);

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
        }

        const access_token = localStorage.getItem('access_token');
        if (access_token) {
            this.auth.ensureAuthorized().subscribe((user) => {
                if (user && user['features'] && user['features']['id_role']) {
                    this.isValidator = user['features']['validator'];
                }
            });
        }
        this.username = localStorage.getItem('username');
    }

    @HostListener('document:NewObservationEvent', ['$event'])
    newObservationEventHandler(e: CustomEvent): void {
        e.stopPropagation();

        this.observations.features.unshift(e.detail);
        this.observations = {
            type: 'FeatureCollection',
            features: this.observations.features,
        };
        this.updateObservedSpecies();
    }

    private updateObservedSpecies(): void {
        this.observedSpeciesUniqueSorted = this.getUniqueSortedSpecies(
            this.observations.features
        );
    }

    addObsClicked(): void {
        this.modalFlow.first.clicked();
    }

    openValidateModal(validateModal: NgbModalRef, idObs: number): void {
        this.obsToValidate = this.observations.features.find(
            (obs) => obs.properties.id_observation === idObs
        );
        if (this.canValidateObservation()) {
            this.modalRef = this.modalService.open(validateModal, {
                size: 'lg',
                windowClass: 'obs-modal',
                centered: true,
            });
        }
    }

    canValidateObservation(): boolean {
        console.log(
            `<canValidateObservation> this.isValidator`,
            this.isValidator
        );
        console.log(
            `<canValidateObservation> this.obsToValidate.properties`,
            this.obsToValidate.properties
        );
        return (
            this.MainConfig.VERIFY_OBSERVATIONS_ENABLED &&
            this.isValidator &&
            this.obsToValidate.properties.validation_status != 'VALIDATED' &&
            (!this.obsToValidate.properties.observer ||
                (this.obsToValidate.properties.observer &&
                    typeof this.obsToValidate.properties.observer !==
                        'string' &&
                    this.obsToValidate.properties.observer.username !==
                        this.username))
        );
    }

    closeModal(observationId: number = null): void {
        if (observationId) {
            this.route.data.subscribe(() => {
                this.observationsService
                    .getObservation(observationId)
                    .subscribe((updatedObservation: ObservationFeature) => {
                        this.observations.features[
                            this.observations.features.findIndex(
                                (obs) =>
                                    obs.properties.id_observation ===
                                    observationId
                            )
                        ] = updatedObservation;
                    });
            });
        }
        this.modalRef.close();
    }

    private getUniqueSortedSpecies(features: any[]): ObservationPropertiesList {
        const uniqueSpecies = features
            .map((feature) => feature.properties)
            .filter(
                (property, index, self) =>
                    self.findIndex((p) => p.cd_nom === property.cd_nom) ===
                    index
            );

        uniqueSpecies.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        return uniqueSpecies;
    }

    ngOnDestroy(): void {
        if (this.modalRef) this.modalRef.close();
    }
}
