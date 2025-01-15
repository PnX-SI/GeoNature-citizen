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

import { Feature } from 'geojson';

import { MainConfig } from '../../../../conf/main.config';
import {
    TaxonomyListItem,
    ObservationFeature,
    ObservationFeatureCollection,
    ObservationPropertiesList,
} from '../observation.model';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

@Component({
    selector: 'app-obs-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
})
export class ObsListComponent implements OnChanges {
    @Input('observations') observations: ObservationFeatureCollection;
    @Input('observedSpecies') observedSpecies: ObservationPropertiesList;
    @Input('displayOwnerActions') displayOwnerActions = false;
    @Input('displayForm') display_form: boolean;
    @Output('obsSelect') obsSelect: EventEmitter<Feature> = new EventEmitter();
    @Output() deleteObs = new EventEmitter();
    @Output() validateObs = new EventEmitter();
    municipalities: any[];
    observationList: Feature[] = [];
    program_id: number;
    taxa: unknown[];
    validationStatuses: any = {};
    public MainConfig = MainConfig;
    selectedTaxon: TaxonomyListItem = null;
    selectedMunicipality: any = null;
    selectedValidationStatus: any = null;
    username: string = null;
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
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        this.changes$.next(changes);

        if (this.observations && this.observations.features) {
            this.observationList = this.observations.features;
            this.observations$.next(this.observations.features);
            this.municipalities = this.observations.features
                .map((features) => features.properties)
                .map((property) => property.municipality)
                // .map((municipality) => {
                //     return municipality;
                // })
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

        this.username = localStorage.getItem('username');
    }

    // @HostListener("document:NewObservationEvent", ["$event"])
    // public newObservationEventHandler(e: CustomEvent) {
    // }

    onFilterChange(): void {
        const filters: {
            taxon: number;
            municipality: string;
            validationStatus: string;
        } = {
            taxon: null,
            municipality: null,
            validationStatus: null,
        };
        // WARNING: map.observations is connected to this.observationList
        this.observationList = this.observations['features'].filter((obs) => {
            let results: boolean[] = [];
            if (this.selectedMunicipality) {
                results.push(
                    obs.properties.municipality ==
                    this.selectedMunicipality
                );
                filters.municipality = this.selectedMunicipality;
            }
            if (this.selectedTaxon) {
                console.log('this.selectedTaxon', this.selectedTaxon);
                results.push(
                    obs.properties.cd_nom == this.selectedTaxon['cd_nom']
                );
                filters.taxon = this.selectedTaxon['cd_nom'];
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

    getPhotoUrl(o: any): string {
        if (o.properties.photos && o.properties.photos.length > 0) {
          return this.MainConfig.API_ENDPOINT + o.properties.photos[0].url;
        } else if (o.properties.medias && o.properties.medias.length > 0) {
          return (
            this.MainConfig.API_TAXHUB +
            '/tmedias/thumbnail/' +
            o.properties.medias[0].id_media +
            '?h=80'
          );
        } else {
          return 'assets/default_image.png';
        }
      }
}
