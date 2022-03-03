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
import { MainConfig } from '../../../conf/main.config';
import { AuthService } from '../../auth/auth.service';

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

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private route: ActivatedRoute,
        private router: Router,
        private programService: GncProgramsService,
        public flowService: ModalFlowService,
        public breakpointObserver: BreakpointObserver,
        private titleService: Title,
        private metaTagService: Meta,
        authService: AuthService
    ) {
        super(authService);
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
}
