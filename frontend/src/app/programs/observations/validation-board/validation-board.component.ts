import { Component, LOCALE_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { throwError, forkJoin, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as L from 'leaflet';
import * as _ from 'lodash';
import { Point } from 'leaflet';
import { FeatureCollection } from 'geojson';

import { MainConfig } from '../../../../conf/main.config';
import { AuthService } from '../../../auth/auth.service';
import { ObservationsService } from '../observations.service';
import { ModalFlowService } from '../modalflow/modalflow.service';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { TaxonomyList } from '../observation.model';
import { markerIcon } from '../../base/detail/detail.component';

const taxonAutocompleteFields = MainConfig.taxonAutocompleteFields;
const taxonSelectInputThreshold = MainConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold = MainConfig.taxonAutocompleteInputThreshold;

@Component({
    selector: 'validation-board',
    templateUrl: './validation-board.component.html',
    styleUrls: [
        '../../../auth/user-dashboard/user-dashboard.component.css',
        './validation-board.component.css'
    ],
})
export class ValidationBoardComponent {
    public MainConfig = MainConfig;
    modalRef: NgbModalRef;
    username = 'not defined';
    isLoggedIn = false;
    observations: any;
    currentUser: any;
    userAvatar: string | ArrayBuffer;
    obsToValidate: any;
    zoomAlertTimeout: any;
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
    invalidationStatuses: any = [
        {'value': '', 'text': '---', 'link': 'NOT_VALIDATED'},
        {'value': 'unverifiable', 'text': "L'identification est difficile, besoin d'un autre avis", 'link': 'INVALID'},
        {'value': 'off-topic', 'text': "L'espèce observée n'est pas dans la liste des espèces du programme", 'link': 'NON_VALIDATABLE'},
        {'value': 'multiple', 'text': "Les photos correspondent à des espèces différentes, l'observateur doit créer une nouvelle observation", 'link': 'NON_VALIDATABLE'},
    ];
    selectedInvalidationStatus: any = this.invalidationStatuses[0].value;

    constructor(
        private auth: AuthService,
        private observationsService: ObservationsService,
        private modalService: NgbModal,
        private flowService: ModalFlowService,
        private formBuilder: FormBuilder,
        public activeModal: NgbActiveModal,
        @Inject(LOCALE_ID) readonly localeId: string,
        private programService: GncProgramsService,

    ) {}

    ngAfterViewInit() {
        const access_token = localStorage.getItem('access_token');
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
                            this.isLoggedIn = true;
                            this.username = user['features']['username'];
                            if (user['features']['avatar'])
                                this.userAvatar =
                                    this.MainConfig.API_ENDPOINT +
                                    '/media/' +
                                    user['features']['avatar'];
                            this.getData();
                            this.flowService
                                .getModalCloseSatus()
                                .subscribe((status) => {
                                    if (status === 'updateObs') this.getData();
                                });
                        }
                    }),
                    catchError((err) => throwError(err))
                )
                .subscribe((user) => {
                    this.currentUser = user;
                });
        }
    }

    getData() {
        const data = [];
        this.observations = null;
        const notValidatedObservations = this.observationsService.getNotValidatedObservations();
        data.push(notValidatedObservations);
        forkJoin(data).subscribe((data: any) => {
            this.observations = data[0];
            this.observations.features.forEach((obs) => {
                const coords: Point = new Point(
                    obs.geometry.coordinates[0],
                    obs.geometry.coordinates[1]
                );
                obs.coords = coords;
            });
        });
    }

    openValidateModal(validateModal: any, idObs: number) {
        this.obsToValidate = this.observations.features.find(obs => obs.properties.id_observation === idObs);
        console.log('new modal to open', this.obsToValidate)
        this.modalRef = this.modalService.open(validateModal, {
            size: 'lg',
            centered: true,
        });

        const map = L.map('validateMap', {
            gestureHandling: true,
        } as any);
        setTimeout(() => {map.invalidateSize()}, 0);  // Leaflet map is bigger than its modal container, the observation is then decentered. Invalidate its size allow it to consider its width.
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
        }).addTo(map);

        const latLng = L.latLng(this.obsToValidate.coords['y'], this.obsToValidate.coords['x']);
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
        this.selectedInvalidationStatus = this.invalidationStatuses.find(s => s.link === this.obsToValidate.properties.validation_status).value
        console.log(this.selectedInvalidationStatus)
    }

    closeModal() {
        this.modalRef.close();
    }

    onValidateObs() {
        this.onFormSubmit();
    }

    ngOnDestroy(): void {
        if (this.modalRef) this.modalRef.close();
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
                                ? // ? this.taxa[taxon]["medias"][0]["url"]
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

    selectPropositionTaxon(): void {
        if (this.taxa) {
            this.onTaxonSelected(Object.values(this.taxa).find(t => t.cd_nom === this.obsToValidate.properties.cd_nom))
        }
    }

    onTaxonSelected(taxon: any): void {
        this.selectedTaxon = taxon;
        this.validationForm.controls['cd_nom'].patchValue({
            cd_nom: taxon.taxref['cd_nom'],
            name: taxon.taxref.nom_complet,
        });
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
            this.closeModal()
        });
    }

    creatFromDataToPost(): FormData {
        let formData: FormData = new FormData();
        const taxon = this.validationForm.get('cd_nom').value;
        let cd_nom = Number.parseInt(taxon);
        if (isNaN(cd_nom)) {
            cd_nom = Number.parseInt(taxon.cd_nom);
        }
        formData.append('cd_nom', cd_nom.toString());
        formData.append('comment', this.obsToValidate.properties.comment + this.obsToValidate.properties.comment ? ' ' : '' + this.validationForm.get('comment').value)
        formData.append('id_observation', this.validationForm.get('id_observation').value);
        formData.append('report_observer', this.validationForm.get('report_observer').value);
        formData.append('non_validatable_status', this.validationForm.get('non_validatable_status').value);
        console.log(formData)
        return formData;
    }
}
