import { Component, OnChanges, Input } from '@angular/core';

import * as _ from 'lodash';
import { FeatureCollection, Feature } from 'geojson';
import { AppConfig } from '../../../../../conf/app.config';
import { UserService } from '../../user.service.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ModalsTopbarService } from '../../../../core/topbar/modalTopbar.service';
import { CustomFormValidator } from '../../customFormValidator';

@Component({
    selector: 'observers-list',
    templateUrl: './observers-list.component.html',
    styleUrls: ['./observers-list.component.css'],
})
export class ObserversListComponent implements OnChanges {
    @Input('observers') observersCollection: FeatureCollection;
    @Input('areas') areas: FeatureCollection;
    @Input('userDashboard') userDashboard = false;
    @Input('program_id') program_id: number;
    @Input('admin') admin = false;
    observers: Feature[] = [];
    taxa: any[] = [];
    appConfig = AppConfig;
    page = 1;
    pageSize = 10;
    collectionSize = 0;

    modalRef;
    personalInfo;
    userForm;
    editedUserId = 0;
    areasList = [];

    constructor(
        private userService: UserService,
        private formBuilder: FormBuilder,
        private modalService: ModalsTopbarService
    ) {}

    initForm() {
        this.userForm = this.formBuilder.group({
            username: [
                {
                    value: this.personalInfo.features.username,
                    disabled: true,
                },
            ],
            category: [this.personalInfo.features.category],
            areas_access: [this.personalInfo.features.areas_access],
            email: [
                this.personalInfo.features.email,
                [
                    Validators.required,
                    Validators.pattern(
                        "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
                    ),
                ],
            ],
        });
    }

    onUpdateUserData(userForm) {
        userForm = _.omitBy(userForm, _.isNil);
        delete userForm.username;
        this.userService
            .updateUserData(this.editedUserId, userForm)
            .subscribe((user: any) => {
                this.userService.userEdited.emit();
                this.modalRef.close();
            });
    }

    onEditUserInfos(id, modal): void {
        this.editedUserId = id;
        this.userService.getUserInfo(id).subscribe((data) => {
            this.personalInfo = data;

            if (this.areas && this.areas.features) {
                this.areasList = this.areas.features
                    .map((area) => area.properties)
                    .filter(
                        (area) =>
                            area.id_role !== this.personalInfo.features.id_role
                    );
            }

            this.initForm();
            this.modalRef = this.modalService.open(modal, {
                size: 'lg',
                windowClass: 'add-obs-modal',
                centered: true,
            });
        });
    }

    ngOnChanges() {
        if (this.observersCollection) {
            this.collectionSize = this.observersCollection['count'];
            this.refreshList();
        }
    }

    refreshList() {
        this.observers = this.observersCollection['features'].slice(
            (this.page - 1) * this.pageSize,
            (this.page - 1) * this.pageSize + this.pageSize
        );
    }
}
