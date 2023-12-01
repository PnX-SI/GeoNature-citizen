import {
    Component,
    OnChanges,
    Input,
    // HostListener,
    ChangeDetectorRef,
    SimpleChanges,
    Output,
    EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, merge } from 'rxjs';
import { pluck, share } from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { MainConfig } from '../../../../conf/main.config';
import {
    TaxonomyList,
    TaxonomyListItem,
    ObservationFeature,
} from '../observation.model';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

@Component({
    selector: 'app-obs-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
})
export class ObsListComponent implements OnChanges {
    @Input('observations') observations: FeatureCollection;
    @Input('userObservations') userObservations: FeatureCollection;
    @Input('taxa') surveySpecies: TaxonomyList;
    @Input('displayOwnerActions') displayOwnerActions: boolean = false;
    @Input('displayForm') display_form: boolean;
    @Output('obsSelect') obsSelect: EventEmitter<Feature> = new EventEmitter();
    @Output() deleteObs = new EventEmitter();
    @Output() validateObs = new EventEmitter();
    municipalities: any[];
    observationList: Feature[] = [];
    program_id: number;
    taxa: any[];
    validationStatuses: any = {};
    public MainConfig = MainConfig;
    selectedTaxon: TaxonomyListItem = null;
    selectedMunicipality: any = null;
    selectedValidationStatus: any = null;
    changes$ = new BehaviorSubject<SimpleChanges>(null);
    observations$ = new BehaviorSubject<Feature[]>(null);
    features$ = merge(
        this.observations$,
        this.changes$.pipe(
            pluck('observations', 'currentValue', 'features'),
            share()
        )
    );

    constructor(
        private cd: ChangeDetectorRef,
        public router: Router,
        private userService: UserService,
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        this.changes$.next(changes);

        if (this.observations) {

            if (this.userObservations) {
                this.observations.features.forEach(observation => {
                    if (this.userObservations.features.map(o => o.properties.id_observation).includes(observation.properties.id_observation)) {
                        observation.properties.readOnly = true
                    }
                });
            }
            this.observationList = this.observations['features'];
            this.observations$.next(this.observations['features']);
            this.municipalities = this.observations.features
                .map((features) => features.properties)
                .map((property) => property.municipality)
                .map((municipality) => {
                    return municipality.name;
                })
                .filter((item, pos, self) => {
                    return self.indexOf(item) === pos;
                });
            this.userService.getValidationStatuses().subscribe((allValidationStatuses) => {
                Array.from(
                    new Set(this.observations.features
                        .map((features) => features.properties)
                        .map((property) => {
                            return property.validation_status;
                        })
                    )
                ).map((status) => {
                    this.validationStatuses[status] = allValidationStatuses[status]
                })

            });
        }
    }

    // @HostListener("document:NewObservationEvent", ["$event"])
    // public newObservationEventHandler(e: CustomEvent) {
    // }

    onFilterChange(): void {
        let filters: { taxon: string; municipality: string; validationStatus: string } = {
            taxon: null,
            municipality: null,
            validationStatus: null,
        };
        // WARNING: map.observations is connected to this.observationList
        this.observationList = this.observations['features'].filter((obs) => {
            let results: boolean[] = [];
            if (this.selectedMunicipality) {
                results.push(
                    obs.properties.municipality.name ==
                        this.selectedMunicipality
                );
                filters.municipality = this.selectedMunicipality;
            }
            if (this.selectedTaxon) {
                results.push(
                    obs.properties.cd_nom == this.selectedTaxon.taxref['cd_nom']
                );
                filters.taxon = this.selectedTaxon.taxref['cd_nom'];
            }
            if (this.selectedValidationStatus) {
                results.push(
                    obs.properties.validation_status == this.selectedValidationStatus
                );
                filters.validationStatus = this.selectedValidationStatus;
            }
            return results.indexOf(false) < 0;
        });
        this.observations$.next(this.observationList);

        if (filters.taxon || filters.municipality) {
            const event: CustomEvent = new CustomEvent(
                'ObservationFilterEvent',
                {
                    bubbles: true,
                    cancelable: true,
                    detail: filters,
                }
            );
            document.dispatchEvent(event);
        }
    }

    onObsClick(e): void {
        this.obsSelect.emit(e);
    }

    trackByObs(index: number, obs: ObservationFeature): number {
        return obs.properties.id_observation;
    }

    onValidateClick(observation) {
        this.validateObs.emit(observation.properties.id_observation)
    }
}
