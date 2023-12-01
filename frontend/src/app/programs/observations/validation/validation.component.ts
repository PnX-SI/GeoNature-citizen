import { Component, LOCALE_ID, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { throwError, Observable } from 'rxjs';
import * as L from 'leaflet';
import * as _ from 'lodash';
import { FeatureCollection, Feature } from 'geojson';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    tap,
} from 'rxjs/operators';


import { MainConfig } from '../../../../conf/main.config';
import { AuthService } from '../../../auth/auth.service';
import { ObservationsService } from '../observations.service';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { TaxonomyList } from '../observation.model';
import { markerIcon } from '../../base/detail/detail.component';
import { UserService } from '../../../auth/user-dashboard/user.service.service';

const taxonAutocompleteFields = MainConfig.taxonAutocompleteFields;
const taxonSelectInputThreshold = MainConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold = MainConfig.taxonAutocompleteInputThreshold;
type TempTaxa = {
    cd_nom: number;
    nom_francais: string;
};
const taxonAutocompleteMaxResults = 10;


@Component({
    selector: 'validation-modal',
    templateUrl: './validation.component.html',
    styleUrls: [
        '../../../auth/user-dashboard/user-dashboard.component.css',
        '../validation-board/validation-board.component.css'
    ],
})
export class ValidationComponent implements OnInit {
    public MainConfig = MainConfig;
    username = 'not defined';
    id_role: number;
    @Input('obsToValidate') obsToValidate: any;
    @Output('onCloseModal') onCloseModal: EventEmitter<any> = new EventEmitter();
    program: FeatureCollection;
    taxonomyListID: number;
    surveySpecies$: Observable<TaxonomyList>;
    taxonSelectInputThreshold = taxonSelectInputThreshold;
    taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
    taxa: TaxonomyList;
    taxaCount: number;
    species: Object[] = [];
    autocomplete = 'isOff';
    selectedTaxon: any;
    validationForm: FormGroup;
    obsCorrection = false;
    obsValidatable = true;
    invalidationStatuses: any;
    selectedInvalidationStatus: any;

    constructor(
        private auth: AuthService,
        private observationsService: ObservationsService,
        private formBuilder: FormBuilder,
        @Inject(LOCALE_ID) readonly localeId: string,
        private programService: GncProgramsService,
        private userService: UserService,
    ) {}

    ngOnInit() {
        this.userService.getInvalidationStatuses().subscribe((statuses) => {
            this.invalidationStatuses = statuses
            this.selectedInvalidationStatus = this.invalidationStatuses.find(s => s.link === this.obsToValidate.properties.validation_status).value
        })
        const map = L.map('validateMap', {
            gestureHandling: true,
        } as any);
        setTimeout(() => {map.invalidateSize()}, 0);  // Leaflet map is bigger than its modal container, the observation is then decentered. Invalidate its size allow it to consider its width.
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
        }).addTo(map);

        const latLng = L.latLng(this.obsToValidate.geometry.coordinates[1], this.obsToValidate.geometry.coordinates[0]);
        L.marker(latLng, { icon: markerIcon }).addTo(map);
        map.setView(latLng, 13)

        this.initForm();

        this.programService
            .getProgram(this.obsToValidate.properties.id_program)
            .subscribe((result: FeatureCollection) => {
                this.program = result;
                this.taxonomyListID =
                    this.program.features[0].properties.taxonomy_list;
                this.surveySpecies$ = this.programService
                    .getProgramTaxonomyList(this.taxonomyListID)
                    .pipe(
                        tap((species) => {
                            this.taxa = species;
                            this.taxaCount = Object.keys(this.taxa).length;
                            if (
                                this.taxaCount >=
                                this.taxonAutocompleteInputThreshold
                            ) {
                                this.inputAutoCompleteSetup();
                            } else if (this.taxaCount == 1) {
                                this.onTaxonSelected(this.taxa[0]);
                            }
                            this.selectPropositionTaxon();
                        })
                    );
                this.surveySpecies$.subscribe();
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
                        this.id_role = user['features']['id_role'];
                    }
                });
        }
    }

    inputAutoCompleteSetup = () => {
        for (let taxon in this.taxa) {
            for (let field of taxonAutocompleteFields) {
                if (this.taxa[taxon]['taxref'][field]) {
                    this.species.push({
                        name:
                            field === 'cd_nom'
                                ? `${this.taxa[taxon]['taxref']['cd_nom']} - ${this.taxa[taxon]['taxref']['nom_complet']}`
                                : this.taxa[taxon]['taxref'][field],
                        cd_nom: this.taxa[taxon]['taxref']['cd_nom'],
                        icon:
                            this.taxa[taxon]['medias'].length >= 1
                                ?
                                  MainConfig.API_TAXHUB +
                                  '/tmedias/thumbnail/' +
                                  this.taxa[taxon]['medias'][0]['id_media'] +
                                  '?h=20'
                                : 'assets/default_image.png',
                    });
                }
            }
        }
        this.autocomplete = 'isOn';
    };

    inputAutoCompleteSearch = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map((term) =>
                term === '' // term.length < n
                    ? []
                    : this.species
                          .filter(
                              (v) =>
                                  v['name']
                                      .toLowerCase()
                                      .indexOf(term.toLowerCase()) > -1
                          )
                          .slice(0, taxonAutocompleteMaxResults)
            )
        );

    inputAutoCompleteFormatter = (taxon: { name: string}) => {
        this.onTaxonSelected(taxon, false)
        return taxon.name
    };

    selectPropositionTaxon(): void {
        if (this.taxa) {
            this.onTaxonSelected(Object.values(this.taxa).find(t => t.cd_nom === this.obsToValidate.properties.cd_nom))
        }
    }

    onTaxonSelected(taxon: any, shouldPatchForm: Boolean = true): void {
        this.selectedTaxon = taxon;
        if (shouldPatchForm) {
            this.validationForm.controls['cd_nom'].patchValue({
                cd_nom: taxon.taxref['cd_nom'],
                name: taxon.taxref.nom_complet,
            });
        }
        this.obsCorrection = this.selectedTaxon.cd_nom !== this.obsToValidate.properties.cd_nom;
        if (this.obsCorrection) {
            this.selectedInvalidationStatus = this.invalidationStatuses[0].value;
        }
    }

    isSelectedTaxon(taxon: any): boolean {
        if (this.selectedTaxon)
            return this.selectedTaxon.taxref.cd_nom === taxon.taxref.cd_nom;
    }

    initForm() {
        this.validationForm = this.formBuilder.group(
            {
                id_observation: [this.obsToValidate.properties.id_observation],
                cd_nom: ['', Validators.required],
                name: [''],
                id_role: [this.id_role],
                comment: [''],
                report_observer: [true],
                non_validatable_status: ['']
            }
        );
    }

    onSelectInvalidObs(invalidationStatus): void {
        this.obsValidatable = !invalidationStatus;
        if (invalidationStatus) {
            this.selectPropositionTaxon();
        }
    }

    onFormSubmit(): void {
        let formData = this.creatFromDataToPost();
        this.observationsService.updateObservation(formData).subscribe(() => {
            this.onCloseModal.emit(this.obsToValidate.properties.id_observation);
        });
    }

    cancelValidation(): void {
        this.onCloseModal.emit();
    }

    creatFromDataToPost(): FormData {
        let formData: FormData = new FormData();
        const taxon = this.validationForm.get('cd_nom').value;
        let cd_nom = Number.parseInt(taxon);
        if (isNaN(cd_nom)) {
            cd_nom = Number.parseInt(taxon.cd_nom);
        }
        const tempTaxa = this.taxa as Array<unknown> as Array<TempTaxa>;
        const taxon_name: TempTaxa = tempTaxa.filter(
            (t) => t.cd_nom == cd_nom
        )[0];
        formData.append('cd_nom', cd_nom.toString());
        formData.append('name', taxon_name.nom_francais);
        formData.append('comment', this.obsToValidate.properties.comment + this.obsToValidate.properties.comment ? ' ' : '' + this.validationForm.get('comment').value)
        formData.append('id_observation', this.validationForm.get('id_observation').value);
        formData.append('report_observer', this.validationForm.get('report_observer').value);
        formData.append('non_validatable_status', this.validationForm.get('non_validatable_status').value);
        formData.append('id_validator', this.id_role.toString());
        return formData;
    }
}
