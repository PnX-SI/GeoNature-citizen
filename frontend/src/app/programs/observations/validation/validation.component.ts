import {
    Component,
    LOCALE_ID,
    Inject,
    OnInit,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Observable } from 'rxjs';
import * as L from 'leaflet';
import * as _ from 'lodash';
import { FeatureCollection } from 'geojson';
import {
    map,
    share,
    switchMap,
    tap,
} from 'rxjs/operators';

import { MainConfig } from '../../../../conf/main.config';
import { AuthService } from '../../../auth/auth.service';
import { ObservationsService } from '../observations.service';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { TaxonomyList, TaxonomyListItem } from '../observation.model';
import { markerIcon } from '../../base/detail/detail.component';
import { UserService } from '../../../auth/user-dashboard/user.service.service';
import { TaxhubService } from '../../../api/taxhub.service';
import { getPreferredName } from '../../../api/getPreferredName';

const taxonSelectInputThreshold = MainConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold =
    MainConfig.taxonAutocompleteInputThreshold;
const taxonDisplayImageWhenUnique = MainConfig.taxonDisplayImageWhenUnique;

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
        '../validation-board/validation-board.component.css',
    ],
})
export class ValidationComponent implements OnInit {
    public MainConfig = MainConfig;
    id_role: number;
    @Input('obsToValidate') obsToValidate: any;
    @Output('onCloseModal') onCloseModal: EventEmitter<any> =
        new EventEmitter();
    program: FeatureCollection;
    taxonomyListID: number;
    surveySpecies$: Observable<TaxonomyList>;
    surveySpecies: TaxonomyList;
    taxonSelectInputThreshold = taxonSelectInputThreshold;
    taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
    taxonDisplayImageWhenUnique = taxonDisplayImageWhenUnique;
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
        private _taxhubService: TaxhubService
    ) {}

    ngOnInit(): void {
        this.userService.getInvalidationStatuses().subscribe((statuses) => {
            this.invalidationStatuses = statuses;
            this.selectedInvalidationStatus = this.invalidationStatuses.find(
                (s) =>
                    s.link === this.obsToValidate.properties.validation_status
            ).value;
        });
        const leafletMap = L.map('validateMap', {
            gestureHandling: true,
        } as any);
        setTimeout(() => {
            leafletMap.invalidateSize();
        }, 0); // Leaflet map is bigger than its modal container, the observation is then decentered. Invalidate its size allow it to consider its width.
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
        }).addTo(leafletMap);

        const latLng = L.latLng(
            this.obsToValidate.geometry.coordinates[1],
            this.obsToValidate.geometry.coordinates[0]
        );
        L.marker(latLng, { icon: markerIcon }).addTo(leafletMap);
        leafletMap.setView(latLng, 13);

        this.initForm();

        this.programService
            .getProgram(this.obsToValidate.properties.id_program)
            .subscribe((result: FeatureCollection) => {
                this.program = result;
                this.taxonomyListID =
                    this.program.features[0].properties.taxonomy_list;
                this.surveySpecies$ = this.programService
                    .getAllProgramTaxonomyList()
                    .pipe(
                        map((listsTaxonomy) => {
                            this.taxaCount = listsTaxonomy
                                .filter(
                                    (lt) => lt.id_liste === this.taxonomyListID
                                )
                                .map((lt) => lt.nb_taxons)[0];
                            return (
                                this.taxaCount <
                                this.taxonAutocompleteInputThreshold
                            );
                        }),
                        switchMap((shouldFetchTaxonomyList) => {
                            if (shouldFetchTaxonomyList) {
                                return this.programService
                                    .getProgramTaxonomyList(
                                        this.taxonomyListID,
                                        {
                                            limit: this
                                                .taxonAutocompleteInputThreshold,
                                        }
                                    )
                                    .pipe(
                                        tap((species) => {
                                            this.taxa =
                                                this._taxhubService.setMediasAndAttributs(
                                                    species
                                                );
                                            if (this.taxaCount == 1) {
                                                this.onTaxonSelected(
                                                    this.taxa[0]
                                                );
                                            }
                                            this.selectPropositionTaxon();
                                        }),
                                        map((species: TaxonomyList) => {
                                            if (
                                                this.taxaCount <
                                                this
                                                    .taxonAutocompleteInputThreshold
                                            ) {
                                                return species.sort((a, b) => {
                                                    const taxA =
                                                        a.nom_francais ||
                                                        a.taxref.nom_vern ||
                                                        '';
                                                    const taxB =
                                                        b.nom_francais ||
                                                        b.taxref.nom_vern ||
                                                        '';
                                                    return taxA.localeCompare(
                                                        taxB
                                                    );
                                                });
                                            } else {
                                                return species;
                                            }
                                        })
                                    );
                            } else {
                                return [];
                            }
                        }),
                        share()
                    );
                this.surveySpecies$.subscribe((sortedSpecies) => {
                    this.surveySpecies = sortedSpecies;
                });
            });

        const access_token = localStorage.getItem('access_token');
        if (access_token) {
            this.auth.ensureAuthorized().subscribe((user) => {
                if (user && user['features'] && user['features']['id_role']) {
                    this.id_role = user['features']['id_role'];
                }
            });
        }
    }

    selectPropositionTaxon(): void {
        if (this.taxa) {
            this.onTaxonSelected(
                Object.values(this.taxa).find(
                    (t) => t.cd_nom === this.obsToValidate.properties.cd_nom
                )
            );
        }
    }

    onTaxonSelected(taxon: any, shouldPatchForm = true): void {
        this.selectedTaxon = taxon;
        if (shouldPatchForm) {
            this.validationForm.controls['cd_nom'].patchValue({
                cd_nom: taxon.taxref['cd_nom'],
                name: getPreferredName(taxon),
            });
        }
        this.obsCorrection =
            this.selectedTaxon.cd_nom !== this.obsToValidate.properties.cd_nom;
        if (this.obsCorrection) {
            this.selectedInvalidationStatus =
                this.invalidationStatuses[0].value;
        }
    }

    isSelectedTaxon(taxon: TaxonomyListItem): boolean {
        if (this.selectedTaxon)
            return this.selectedTaxon.taxref.cd_nom === taxon.taxref.cd_nom;
    }

    initForm(): void {
        console.log('obsToValidate', this.obsToValidate);
        this.validationForm = this.formBuilder.group({
            id_observation: [this.obsToValidate.properties.id_observation],
            cd_nom: ['', Validators.required],
            name: [''],
            id_role: [this.id_role],
            comment: [''],
            report_observer: [true],
            non_validatable_status: [''],
        });
    }

    onSelectInvalidObs(invalidationStatus: boolean): void {
        this.obsValidatable = !invalidationStatus;
        if (invalidationStatus) {
            this.selectPropositionTaxon();
        }
    }

    onFormSubmit(): void {
        let formData = this.createFormDataToPost();
        this.observationsService.updateObservation(formData).subscribe(() => {
            this.onCloseModal.emit(
                this.obsToValidate.properties.id_observation
            );
        });
    }

    cancelValidation(): void {
        this.onCloseModal.emit();
    }

    createFormDataToPost(): FormData {
        let formData: FormData = new FormData();
        const taxon = this.validationForm.get('cd_nom').value;
        let cd_nom = Number.parseInt(taxon);
        if (isNaN(cd_nom)) {
            cd_nom = Number.parseInt(taxon.cd_nom);
        }
        const taxon_name = taxon.name;
        formData.append('cd_nom', cd_nom.toString());
        formData.append('name', taxon_name);
        formData.append(
            'comment',
            this.obsToValidate.properties.comment +
                this.obsToValidate.properties.comment
                ? ' '
                : '' + this.validationForm.get('comment').value
        );
        formData.append(
            'id_observation',
            this.validationForm.get('id_observation').value
        );
        formData.append(
            'report_observer',
            this.validationForm.get('report_observer').value
        );
        formData.append(
            'non_validatable_status',
            this.validationForm.get('non_validatable_status').value
        );
        formData.append('id_validator', this.id_role.toString());
        return formData;
    }

    // Expose to HTML
    getPreferredName = getPreferredName;

    onSelectedTaxon(taxon): void {
        this.programService
            .getTaxonInfoByCdNom(taxon.item['cd_nom'])
            .subscribe((taxonFullInfo) => {
                const taxonWithTaxhubInfos =
                    this._taxhubService.setMediasAndAttributs(taxonFullInfo);
                this.selectedTaxon = taxonWithTaxhubInfos[0];
                this.validationForm.controls['cd_nom'].patchValue({
                    cd_nom: this.selectedTaxon['cd_nom'],
                    name: getPreferredName(this.selectedTaxon),
                    icon:
                        this.selectedTaxon['medias'].length >= 1
                            ? // ? this.taxa[taxon]["medias"][0]["url"]
                              MainConfig.API_TAXHUB +
                              '/tmedias/thumbnail/' +
                              this.selectedTaxon['medias']['id_media'] +
                              '?h=20'
                            : 'assets/default_image.png',
                });
            });
    }
}
