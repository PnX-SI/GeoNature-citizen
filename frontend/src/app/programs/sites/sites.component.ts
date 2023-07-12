import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ViewChildren,
    QueryList,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FeatureCollection } from 'geojson';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { Program } from '../programs.models';
import { SiteModalFlowService } from './modalflow/modalflow.service';
import { SiteService } from './sites.service';
import { SitesMapComponent } from './map/map.component';
import { SitesListComponent } from './list/list.component';
import { SiteModalFlowComponent } from './modalflow/modalflow.component';
import { ProgramBaseComponent } from '../base/program-base.component';
import { conditionallyCreateMapObjectLiteral } from '@angular/compiler/src/render3/view/util';
import { MapService } from '../base/map/map.service';


@Component({
    selector: 'app-sites',
    templateUrl: './sites.component.html',
    styleUrls: [
        '../observations/obs.component.css',
        '../../home/home.component.css',
        './sites.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SitesComponent extends ProgramBaseComponent implements OnInit {
    title = 'Sites';
    sites: FeatureCollection;
    userDashboard = false;
    canAddSite = false;
    tooltipAddButton = 'Cliquez d\'abord sur la carte avant d\'ajouter un point';
    @ViewChild(SitesMapComponent, { static: true }) sitesMap: SitesMapComponent;
    @ViewChild(SitesListComponent, { static: true })
    sitesList: SitesListComponent;
    @ViewChildren(SiteModalFlowComponent)
    modalFlow: QueryList<SiteModalFlowComponent>;
    isMobile: boolean;
    hideProgramHeader = false;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        public flowService: SiteModalFlowService,
        public siteService: SiteService,
        private mapService: MapService,
        public breakpointObserver: BreakpointObserver,
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.program_id = params['id'];
        });
        this.route.fragment.subscribe((fragment) => {
            this.fragment = fragment;
        });
        this.siteService.newSiteCreated.subscribe((newSiteFeature) => {
            this.loadSites();
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

        this.mapService.coordsChange.subscribe((_value) => {
            this.canAddSite = true;
            this.tooltipAddButton = 'Ajouter un élément';
        });

        this.mapService.lineChange.subscribe((_value) => { //TODO could be factorized with coordsChange...
            this.canAddSite = true;
            this.tooltipAddButton = 'Ajouter un élément';
        });

        this.mapService.polygonChange.subscribe((_value) => { //TODO could be factorized with coordsChange...
            this.canAddSite = true;
            this.tooltipAddButton = 'Ajouter un élément';
        });

        this.route.data.subscribe((data: { programs: Program[] }) => {
            // TODO: merge observables
            this.programs = data.programs;
            this.program = this.programs.find(
                (p) => p.id_program == this.program_id
            );
            this.loadSites();
            this.programService
                .getProgram(this.program_id)
                .subscribe((program) => (this.programFeature = program));
        });
    }

    loadSites(): void {
        this.programService
            .getProgramSites(this.program_id)
            .subscribe((sites) => {
                this.sites = sites;
            });
    }

    addSiteClicked(): void {
        this.modalFlow.first.clicked();
    }
    toTop() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
}
