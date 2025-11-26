import {
    Component,
    ViewEncapsulation,
    OnInit,
    AfterViewInit,
    Input,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

import { MainConfig } from '../../../../conf/main.config';

import { GNCFrameworkComponent } from '../../base/jsonform/framework/framework.component';
import { ngbDateMaxIsToday } from '../../observations/form/formValidators';
import { SiteService } from '../sites.service';

declare let $: any;

@Component({
    selector: 'app-site-visit-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SiteVisitFormComponent implements OnInit, AfterViewInit {
    private readonly URL = MainConfig.API_ENDPOINT;
    @Input() site_id: number;
    @Input() visit_id: number;
    @Input() visit_data: any;
    today = new Date();
    visitForm = new FormGroup({
        date: new FormControl(
            {
                year: this.today.getFullYear(),
                month: this.today.getMonth() + 1,
                day: this.today.getDate(),
            },
            [Validators.required, ngbDateMaxIsToday()]
        ),
        data: new FormControl(''),
    });
    currentStep = 1;
    partialLayout: any[] = [];
    advancedMode = false;
    jsonData: object = {};
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
    formInputObject: object = {};

    photos: any[] = [];

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        public siteService: SiteService
    ) { }

    ngOnInit() {
        this.loadJsonSchema().subscribe((data: any) => {
            this.initForm(data);
            if (this.visit_id) {
                this.initJsonData(this.visit_data.json_data);
                const visit_date = new Date(this.visit_data.date);
                this.visitForm.controls.date.setValue({
                    year: visit_date.getFullYear(),
                    month: visit_date.getMonth() + 1,
                    day: visit_date.getDate(),
                });
            }
        });
    }
    initJsonData(visit_json_data) {
        // Visit edition json data initialisation
        this.jsonData = {};
        if (this.jsonSchema.steps) {
            this.jsonSchema.steps.forEach((step, index) => {
                this.jsonData[index + 1] = {};
                step.layout.forEach((elt) => {
                    if (elt.key && elt.key in visit_json_data) {
                        this.jsonData[index + 1][elt.key] =
                            visit_json_data[elt.key];
                    } else if (elt.type === 'section') {
                        elt.items.forEach((item) => {
                            if (item.key in visit_json_data) {
                                this.jsonData[index + 1][item.key] =
                                    visit_json_data[item.key];
                            }
                        });
                    }
                });
            });
        } else {
            this.jsonData = visit_json_data; // TODO is it correct ?
        }
        this.updateFormInput();
    }
    initForm(json_schema) {
        this.jsonSchema = json_schema;
        this.updatePartialLayout();
        this.updateFormInput();
        this.readyToDisplay = true;
    }
    loadJsonSchema() {
        return this.http.get(`${this.URL}/sites/${this.site_id}/jsonschema`);
    }
    updateFormInput() {
        this.updatePartialLayout();
        this.formInputObject = {
            schema: this.jsonSchema.schema,
            data: this.jsonData[this.currentStep],
            layout: this.partialLayout,
        };
    }
    ngAfterViewInit() { }
    nextStep() {
        this.currentStep += 1;
        this.updateFormInput();
    }
    previousStep() {
        this.currentStep -= 1;
        this.updateFormInput();
    }
    updatePartialLayout() {
        if (this.jsonSchema.steps) {
            this.partialLayout =
                this.jsonSchema.steps[this.currentStep - 1].layout;
        } else {
            this.partialLayout = this.jsonSchema.layout
                ? this.jsonSchema.layout
                : this.jsonSchema.form;
        }
        this.partialLayout[this.partialLayout.length - 1].expanded =
            this.advancedMode;
    }
    isFirstStep() {
        return this.currentStep === 1;
    }
    isLastStep() {
        return this.currentStep === this.totalSteps();
    }
    totalSteps() {
        return this.jsonSchema.steps ? this.jsonSchema.steps.length : 1;
    }
    invalidStep() {
        return this.currentStep === 1 && this.visitForm.get('date').invalid;
    }
    onJsonFormChange(e) {
        this.jsonData[this.currentStep] = e;
    }
    getTotalJsonData() {
        let resp = {};
        for (const key of Object.keys(this.jsonData)) {
            resp = { ...resp, ...this.jsonData[key] };
        }
        return resp;
    }
    toogleAdvancedMode() {
        this.advancedMode = !this.advancedMode;
        this.updatePartialLayout();
    }
    addImage(event) {
        this.photos.push(event.file);
    }
    deleteImage(event) {
        for (let i = 0; i < this.photos.length; i++) {
            if (this.photos[i] == event.file) {
                this.photos.splice(i, 1);
            }
        }
    }
    onFormSubmit(): void {
        this.postSiteVisit().subscribe(
            (data) => {
                const visitId =
                    this.visit_id || data['features'][0]['id_visit'];
                if (this.photos.length > 0) {
                    this.postVisitPhotos(visitId).subscribe(
                        (resp) => {
                            this.siteService.newSiteCreated.emit(true);
                            this.siteService.siteEdited.emit(true);
                        },
                        (err) => console.error(err),
                        () => { }
                    );
                }
            },
            (err) => console.error(err),
            () => { }
            // TODO: queue obs in list
        );
    }

    postSiteVisit(): Observable<any> {
        const httpOptions = {
            headers: new HttpHeaders({
                Accept: 'application/json',
            }),
        };
        const visitDate = NgbDate.from(this.visitForm.controls.date.value);
        this.visitForm.patchValue({
            data: this.getTotalJsonData(),
            date: new Date(
                visitDate.year,
                visitDate.month - 1,
                visitDate.day,
                12
            )
                .toISOString()
                .match(/\d{4}-\d{2}-\d{2}/)[0],
        });
        let method = 'post';
        let url = `${this.URL}/sites/${this.site_id}/visits`;
        const formData = this.visitForm.value;
        if (this.visit_id) {
            const id_media_to_delete = this.visit_data.photos
                .filter((p) => p.checked)
                .map((p) => p.id_media);
            formData['delete_media'] = JSON.stringify(id_media_to_delete);
            method = 'patch';
            url = `${this.URL}/sites/visits/${this.visit_id}`;
        }
        return this.http[method]<any>(url, this.visitForm.value, httpOptions);
    }

    postVisitPhotos(visitId: number) {
        const formData = new FormData();
        this.photos.forEach((file) => {
            formData.append('file', file);
        });
        return this.http.post<any>(
            `${this.URL}/sites/${this.site_id}/visits/${visitId}/photos`,
            formData
        );
    }
}
