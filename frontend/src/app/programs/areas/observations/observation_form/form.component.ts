import {
    Component,
    ViewEncapsulation,
    OnInit,
    AfterViewInit,
    ViewChild,
    Input,
    ElementRef,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../../../conf/app.config';

import { GNCFrameworkComponent } from '../../../base/jsonform/framework/framework.component';
import { ngbDateMaxIsToday } from '../../../observations/form/formValidators';
import { AreaService } from '../../areas.service';
import { GncProgramsService } from '../../../../api/gnc-programs.service';

declare let $: any;

@Component({
    selector: 'app-species-site-obs-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSiteObservationFormComponent
    implements OnInit, AfterViewInit
{
    private readonly URL = AppConfig.API_ENDPOINT;
    @Input() species_site_id: number;
    @Input('data') data;

    validationStates = AppConfig.validationStates;
    today = new Date();
    observationForm = new FormGroup({
        date: new FormControl(
            {
                year: this.today.getFullYear(),
                month: this.today.getMonth() + 1,
                day: this.today.getDate(),
            },
            [Validators.required, ngbDateMaxIsToday()]
        ),
        json_data: new FormControl(''),
        state: new FormControl(''),
        species_stage_id: new FormControl(0),
        stages_step_id: new FormControl(0),
        id_species_site_observation: new FormControl(),
    });
    selectedStage = 0;
    selectedStep = 0;
    steps: any[] = [];
    partialLayout: any[] = [];
    advancedMode = false;
    jsonData: object = {};
    speciesSite: any;
    formOptions: any = {
        loadExternalAssets: false,
        debug: false,
        returnEmptyFields: false,
        addSubmit: false,
    };
    jsonSchema: any = {};
    readyToDisplay = false;
    GNCBootstrap4Framework: any = {
        framework: GNCFrameworkComponent,
    };
    formInputObject: object;

    photos: any[] = [];
    stagesFeatures: any[] = [];
    apiEndpoint = '';

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        private dateParser: NgbDateParserFormatter,
        public areaService: AreaService
    ) {
        this.apiEndpoint = AppConfig.API_ENDPOINT;
    }

    ngOnInit() {
        console.debug('ngOnInit');
        if (this.data && this.data.obsUpdateData) {
            this.patchForm(this.data.obsUpdateData);
        }

        this.loadJsonSchema().subscribe((data: any) => {
            this.initForm(data);
        });
    }

    patchForm(obsUpdateData): void {
        this.species_site_id = obsUpdateData.id_species_site;
        this.jsonData = obsUpdateData.json_data;

        this.observationForm.patchValue({
            name: obsUpdateData.name,
            area_id: obsUpdateData.area_id,
            id_stages_step: obsUpdateData.id_stages_step,
            state: obsUpdateData.state,
            date: this.dateParser.parse(obsUpdateData.date),
            id_species_site_observation:
                obsUpdateData.id_species_site_observation,
        });

        this.selectedStage = obsUpdateData.stages_step
            ? obsUpdateData.stages_step.id_species_stage
            : 0;

        this.selectedStep = obsUpdateData.id_stages_step;
    }

    ngAfterViewInit() {
        this.programService
            .getSpeciesSiteDetails(this.species_site_id, true, true)
            .subscribe((speciesSites) => {
                this.speciesSite = speciesSites['features'][0];
                this.stagesFeatures =
                    this.speciesSite.properties.stages.features.filter(
                        (stage) => stage.properties.active
                    );

                if (this.data.id_species_stage) {
                    this.selectedStage = this.data.id_species_stage;
                }

                this.onSelectedStageChange();
            });
    }

    initForm(json_schema) {
        this.jsonSchema = json_schema;
        this.updatePartialLayout();
        this.updateFormInput();
        this.readyToDisplay = true;
    }
    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/areas/species_site/${this.species_site_id}/obs/jsonschema`
        );
    }
    updateFormInput() {
        this.updatePartialLayout();
        this.formInputObject = {
            schema: this.jsonSchema.schema,
            data: this.jsonData,
            layout: this.partialLayout,
        };
    }
    updatePartialLayout() {
        this.partialLayout = this.jsonSchema.layout;
        this.partialLayout[this.partialLayout.length - 1].expanded =
            this.advancedMode;
    }
    yourOnChangesFn(e) {
        this.jsonData = e;
    }
    toogleAdvancedMode() {
        this.advancedMode = !this.advancedMode;
        this.updatePartialLayout();
    }
    addImage($event) {
        const img = document.createElement('img');
        img.onload = (event) => {
            let newImage = null;
            if (event.target) {
                newImage = event.target;
            } else if (!event['path'] || !event['path'].length) {
                newImage = event['path'][0];
            }
            if (!newImage) {
                console.error('No image found on this navigator');
                return;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let resizeTimeNumber = 1;
            const maxHeightRatio =
                newImage.height / AppConfig.imageUpload.maxHeight;
            if (maxHeightRatio > 1) {
                resizeTimeNumber = maxHeightRatio;
            }
            const maxWidthRatio =
                newImage.width / AppConfig.imageUpload.maxWidth;
            if (maxWidthRatio > 1 && maxWidthRatio > maxHeightRatio) {
                resizeTimeNumber = maxWidthRatio;
            }

            canvas.width = newImage.width / resizeTimeNumber;
            canvas.height = newImage.height / resizeTimeNumber;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const resizedImage = canvas.toDataURL(
                'image/jpeg',
                AppConfig.imageUpload.quality
            );

            this.photos.push(resizedImage);
        };
        img.src = window.URL.createObjectURL($event.file);
    }
    deleteImage(event) {
        for (let i = 0; i < this.photos.length; i++) {
            if (this.photos[i] == event.file) {
                this.photos.splice(i, 1);
            }
        }
    }

    onSelectedStageChange(): void {
        const stages = this.speciesSite.properties.stages.features.filter(
            (stage) => stage.properties.id_species_stage == this.selectedStage
        );

        const newSteps =
            stages.length && Array.isArray(stages[0].properties.steps.features)
                ? stages[0].properties.steps.features
                : [];

        this.steps = newSteps;
    }

    onSelectedStepChange(): void {
        this.observationForm.get('date').setErrors(null);
    }

    stepIsNotSelected() {
        return (
            this.speciesSite.properties.stages.count && this.selectedStep === 0
        );
    }

    getCurrentStepOrder() {
        let stepOrder = 0;
        this.steps.forEach((step) => {
            if (step.properties.id_stages_step === this.selectedStep) {
                stepOrder = step.properties.order;
            }
        });
        return stepOrder;
    }

    stageAlreadyAddedThisYear() {
        const selectedStepOrder = this.getCurrentStepOrder();
        const observations = this.speciesSite.properties.observations;
        const formDate = new Date(
            this.observationForm.value.date.year,
            this.observationForm.value.date.month - 1,
            this.observationForm.value.date.day
        );

        let sameStageThisYear = false;
        let dateOfOlderStageStep = null;
        let dateOfLatestFirstStep = null;
        observations.features.forEach((observation) => {
            if (
                !sameStageThisYear &&
                observation.properties.stages_step &&
                !isNaN(this.selectedStage) &&
                observation.properties.stages_step.id_species_stage ==
                    this.selectedStage &&
                observation.properties.date.startsWith(
                    this.observationForm.value.date.year + ''
                ) &&
                this.observationForm.value.id_species_site_observation !=
                    observation.properties.id_species_site_observation
            ) {
                const dateParts = observation.properties.date.split('-');
                const currentObsDate = new Date(
                    dateParts[0],
                    dateParts[1] - 1,
                    dateParts[2]
                );
                if (
                    selectedStepOrder === 1 &&
                    observation.properties.stages_step.order > 1
                ) {
                    const dateParts = observation.properties.date.split('-');
                    const currentObsDate = new Date(
                        dateParts[0],
                        dateParts[1] - 1,
                        dateParts[2]
                    );
                    if (
                        !sameStageThisYear ||
                        currentObsDate <= dateOfOlderStageStep
                    ) {
                        dateOfOlderStageStep = currentObsDate;
                    }
                    sameStageThisYear = true;
                }
                if (selectedStepOrder > 1) {
                    if (
                        observation.properties.stages_step.order === 1 &&
                        (!sameStageThisYear ||
                            currentObsDate >= dateOfLatestFirstStep)
                    ) {
                        dateOfLatestFirstStep = currentObsDate;
                    }
                    sameStageThisYear = true;
                }
            }
        });

        if (
            sameStageThisYear &&
            (dateOfOlderStageStep || dateOfLatestFirstStep)
        ) {
            if (
                // a later step was already added. Selected step (order 1) have to be before existing step date
                (selectedStepOrder === 1 && dateOfOlderStageStep > formDate) ||
                //first step have been added, selected step (not the first based on order) have to be after this first existing step
                (selectedStepOrder > 1 &&
                    dateOfLatestFirstStep &&
                    dateOfLatestFirstStep < formDate)
            ) {
                return false;
            }
        }

        return sameStageThisYear;
    }

    onFormSubmit(): Observable<any> {
        console.debug('formValues:', this.observationForm.value);

        if (this.stepIsNotSelected()) {
            const field = this.selectedStage
                ? 'stages_step_id'
                : 'species_stage_id';
            this.observationForm.get(field).setErrors({
                notSelected: true,
            });
            return new Observable((subscriber) => {
                subscriber.next(null);
            });
        }

        if (this.stageAlreadyAddedThisYear()) {
            this.observationForm.get('date').setErrors({
                stepThisYear: true,
            });

            return new Observable((subscriber) => {
                subscriber.next(null);
            });
        }

        if (
            this.selectedStep === 0 ||
            this.observationForm.value.stages_step_id === 0
        ) {
            this.observationForm.get('stages_step_id').setValue(null);
        }

        return this.postSpeciesSiteObservation();
    }

    postSpeciesSiteObservation(): Observable<any> {
        const formData: FormData = new FormData();
        const formValues = this.observationForm.value;
        ['stages_step_id', 'id_species_site_observation', 'state'].forEach(
            (key) => {
                if (formValues[key]) {
                    formData.append(key, formValues[key]);
                }
            }
        );

        let index = 0;
        for (const photoData of this.photos) {
            formData.append('photos[' + index + ']', photoData);
            index++;
        }

        formData.append('json_data', JSON.stringify(this.jsonData));

        const visitDate = NgbDate.from(
            this.observationForm.controls.date.value
        );
        formData.append(
            'date',
            new Date(visitDate.year, visitDate.month - 1, visitDate.day + 1)
                .toISOString()
                .match(/\d{4}-\d{2}-\d{2}/)[0]
        );

        if (this.data.obsUpdateData) {
            const id_media_to_delete = this.data.obsUpdateData.photos
                .filter((p) => p.checked)
                .map((p) => p.id_media);
            formData.append('delete_media', JSON.stringify(id_media_to_delete));

            return this.http.patch<any>(
                `${this.URL}/areas/observations/`,
                formData
            );
        } else {
            return this.http.post<any>(
                `${this.URL}/areas/species_sites/${this.species_site_id}/observations`,
                formData
            );
        }
    }
}
