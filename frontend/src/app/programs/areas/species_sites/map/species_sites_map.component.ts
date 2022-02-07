import { AppConfig } from '../../../../../conf/app.config';

import {
    Component,
    ComponentFactoryResolver,
    Injector,
    Input,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { BaseMapComponent } from './map.component';
import { MapService } from '../../../base/map/map.service';
import { AreaService } from '../../areas.service';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { AreaModalFlowService } from '../../modalflow/modalflow.service';

@Component({
    selector: 'app-species-sites-map',
    template: ` <div [id]="'speciesSitesMap'" class="obsMap" #map></div> `,
    styleUrls: ['../../../base/map/map.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSitesMapComponent extends BaseMapComponent {
    feature_id_key = 'id_species_site';

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        resolver: ComponentFactoryResolver,
        injector: Injector,
        mapService: MapService,
        private areaService: AreaService
    ) {
        super(resolver, injector, mapService);
    }

    ngOnInit() {
        this.areaService.speciesSiteEdited.subscribe(() =>
            this.observationMap.closePopup()
        );
        this.areaService.speciesSiteDeleted.subscribe(() =>
            this.observationMap.closePopup()
        );
    }

    getPopupComponentFactory(): any {
        return this.resolver.resolveComponentFactory(
            SpeciesSiteMarkerPopupComponent
        );
    }
}

@Component({
    selector: 'popup',
    template: `
        <ng-container>
            <img
                [src]="
                    data.photos && data.photos.length
                        ? appConfig.API_ENDPOINT + data.photos[0].url
                        : 'assets/no_photo_light.png'
                "
            />
            <p>
                <b>{{ data.name }}</b>
                <span *ngIf="!userDashboard" class="stages-container">
                    <span
                        *ngFor="let stage of data.stages"
                        [title]="
                            stage.last_obs_date !== 'None'
                                ? 'Observé le ' +
                                  (stage.last_obs_date | date: 'longDate')
                                : stage.name
                        "
                    >
                        <img
                            class="stage-icon"
                            alt="{{ stage.name }} icon"
                            src="assets/stages/{{
                                stage.obs_count > 0 ? 'selected-' : ''
                            }}{{ stage.icon }}"
                            (click)="
                                onAddSpeciesSiteObservationClick(
                                    data.id_species_site,
                                    {
                                        id_species_stage:
                                            stage.id_species_stage,
                                        last_obs_id: stage.last_obs_id
                                    }
                                )
                            "
                        />
                    </span>
                </span>
            </p>
            <div
                [routerLink]="[
                    '/programs',
                    data.area.id_program,
                    'species_sites',
                    data.id_species_site
                ]"
                style="cursor:pointer"
                title="Voir les détails de cet individu"
            >
                <img class="icon" src="assets/binoculars.png" />
            </div>
        </ng-container>
    `,
})
export class SpeciesSiteMarkerPopupComponent {
    @Input() data;
    public appConfig = AppConfig;

    userDashboard = false;

    constructor(
        private flowService: AreaModalFlowService,
        private programService: GncProgramsService
    ) {}

    onAddSpeciesSiteObservationClick(
        species_site_id,
        options: { id_species_stage?; last_obs_id? } = {}
    ) {
        if (options.last_obs_id) {
            this.programService
                .getSpeciesSiteObsDetails(options.last_obs_id)
                .subscribe((observation) => {
                    this.flowService.addSpeciesSiteObservation(
                        species_site_id,
                        {
                            observation: observation.features[0].properties,
                            id_species_stage: options.id_species_stage,
                        }
                    );
                });
            return;
        }

        this.flowService.addSpeciesSiteObservation(species_site_id, {
            id_species_stage: options.id_species_stage,
        });
    }
}
