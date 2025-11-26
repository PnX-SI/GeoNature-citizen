import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MainConfig } from '../../../conf/main.config';
import { AuthService } from './../auth.service';
import { UserService } from './user.service.service';
import { SiteService } from '../../programs/sites/sites.service';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import { Point } from 'leaflet';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFormValidator } from './customFormValidator';
import { ModalFlowService } from '../../programs/observations/modalflow/modalflow.service';

@Component({
    selector: 'app-user-dashboard',
    templateUrl: './user-dashboard.component.html',
    styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
    public MainConfig = MainConfig;
    @ViewChild('siteDeleteModal', { static: true }) siteDeleteModal;
    modalRef: NgbModalRef;
    modalRefDel: NgbModalRef;
    username = 'not defined';
    role_id: number;
    isLoggedIn = false;
    stats: any;
    personalInfo: any = {};
    badges: any;
    main_badges: any = [];
    programs_badges: any = [];
    recognition_badges: any = [];
    observations: any;
    myobs: any;
    mysites: any;
    rows: any = [];
    obsToExport: any = [];
    userForm: FormGroup;
    currentUser: any;
    userAvatar: string | ArrayBuffer;
    extentionFile: any;
    newAvatar: string | ArrayBuffer;
    idObsToDelete: number;
    idSiteToDelete: number;
    tab = 'observations';

    constructor(
        private auth: AuthService,
        private userService: UserService,
        private router: Router,
        private modalService: NgbModal,
        private flowService: ModalFlowService,
        private formBuilder: FormBuilder,
        public siteService: SiteService
    ) { }

    ngOnInit(): void {
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
                            this.stats = user['features']['stats'];
                            this.role_id = user['features']['id_role'];
                            this.userService.role_id = this.role_id;
                            if (user['features']['avatar'])
                                this.userAvatar =
                                    this.MainConfig.API_ENDPOINT +
                                    '/media/' +
                                    user['features']['avatar'];
                            // FIXME: source backend conf
                            this.getData();
                            this.flowService
                                .getModalCloseSatus()
                                .subscribe((status) => {
                                    if (status === 'updateObs') this.getData();
                                });
                            this.siteService.siteEdited.subscribe(() => {
                                this.mysites = null;
                                this.getData();
                            });
                        }
                    }),
                    catchError((err) => throwError(err))
                )
                .subscribe((user) => {
                    this.currentUser = user;
                });
            this.siteService.deleteSite.subscribe(($event) => {
                this.openSiteDeleteModal(this.siteDeleteModal, $event);
            });
        }
    }

    getData() {
        const data = [];
        this.rows = [];
        this.obsToExport = [];
        this.observations = null;
        this.badges = null;
        this.main_badges = [];
        this.programs_badges = [];
        this.recognition_badges = [];
        const badgeCategories = this.userService.getBadgeCategories(
            this.role_id
        );
        const userObservations = this.userService.getObservationsByUserId(
            this.role_id
        );
        const userSites = this.userService.getSitesByUserId(this.role_id);

        data.push(userObservations);
        data.push(userSites);
        if (MainConfig['REWARDS']) {
            data.push(badgeCategories);
        }
        forkJoin(data).subscribe((data: any) => {
            if (data.length > 1) {
                this.myobs = data[0];
                this.mysites = data[1];
                if (MainConfig['REWARDS']) {
                    this.badges = data[2];
                    localStorage.setItem('badges', JSON.stringify(this.badges));
                    if (this.badges.length > 0) {
                        this.badges.forEach((badge) => {
                            if (
                                badge.type == 'all_attendance' ||
                                badge.type == 'seniority'
                            )
                                this.main_badges.push(badge);
                            if (badge.type == 'program_attendance')
                                this.programs_badges.push(badge);
                            if (badge.type == 'recognition')
                                this.recognition_badges.push(badge);
                        });
                    }
                }
                this.observations = this.myobs.features;
                this.observations.forEach((obs) => {
                    const coords: Point = new Point(
                        obs.geometry.coordinates[0],
                        obs.geometry.coordinates[1]
                    );
                    obs.properties.coords = coords; // for use in user obs component
                    this.rowData(obs, coords);
                    this.obsExport(obs);
                });
                this.mysites.features.forEach((site) => {
                    const coords: Point = new Point(
                        site.geometry.coordinates[0],
                        site.geometry.coordinates[1]
                    );
                    site.properties.coords = coords; // for use in user obs component
                    // this.rowData(obs, coords);
                    // this.obsExport(obs);
                });
                if (this.observations.length === 0 && this.mysites.features.length > 0) {
                    this.tab = 'sites'
                }
            } else {
                this.observations = data[0].features;
                this.observations.forEach((obs) => {
                    const coords: Point = new Point(
                        obs.geometry.coordinates[0],
                        obs.geometry.coordinates[1]
                    );
                    obs.coords = coords;
                    this.rowData(obs, coords);
                    this.obsExport(obs);
                });
            }
        });
    }

    rowData(obs, coords) {
        this.rows.push({
            media_url:
                obs.properties.images && !!obs.properties.images.length
                    ? MainConfig.API_ENDPOINT +
                    '/media/' +
                    obs.properties.images[0]
                    : obs.properties.image
                        ? obs.properties.image
                        : obs.properties.medias && !!obs.properties.medias.length
                            ? MainConfig.API_TAXHUB +
                            '/tmedias/thumbnail/' +
                            obs.properties.medias[0].id_media +
                            '?h=80'
                            : 'assets/default_image.png',
            taxref: obs.properties.taxref,
            date: obs.properties.date,
            municipality: obs.properties.municipality,
            program_id: obs.properties.id_program,
            program: obs.properties.program_title,
            count: obs.properties.count,
            comment: obs.properties.comment,
            id_observation: obs.properties.id_observation,
            taxon: {
                media: obs.properties.media,
                taxref: obs.properties.taxref,
            },
            coords: coords,
            json_data: obs.properties.json_data,
        });
    }

    obsExport(obs) {
        this.obsToExport.push({
            id_observation: obs.properties.id_observation,
            date: obs.properties.date,
            programme: obs.properties.program_title,
            denombrement: obs.properties.count,
            commentaire: obs.properties.comment,
            commune: obs.properties.municipality,
            cd_nom: obs.properties.taxref.cd_nom,
            espece: obs.properties.taxref.nom_vern,
            'nom complet': obs.properties.taxref.nom_complet,
            coordonnee_x: obs.geometry.coordinates[0],
            coordonnee_y: obs.geometry.coordinates[1],
            ...obs.properties.json_data,
        });
    }

    onDeletePersonalData() {
        const access_token = localStorage.getItem('access_token');
        this.auth
            .selfDeleteAccount(access_token)
            .then((data) => {
                localStorage.clear();
                const getBackHome = confirm(
                    data.hasOwnProperty('message')
                        ? `${data.message}\nRevenir à l'accueil ?`
                        : data
                );
                if (getBackHome) {
                    this.router.navigate(['/home']);
                }
            })
            .catch((err) => console.error(err));
    }

    onExportPersonalData() {
        this.userService.getPersonalInfo().subscribe((data) => {
            const blob = new Blob([JSON.stringify(data)], {
                type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, 'mydata.txt');
            //alert(JSON.stringify(data));
            // TODO: data format: csv, geojson ? Link observations and associated medias ?
        });
    }

    onExportObservations() {
        const all_json_data_keys = new Set();
        this.observations.forEach((o) => {
            if (o.properties.json_data) {
                Object.keys(o.properties.json_data).forEach((k) => {
                    all_json_data_keys.add(k);
                });
            }
        });
        const csv_str = this.userService.ConvertToCSV(this.obsToExport, [
            'id_observation',
            'espece',
            'cd_nom',
            'nom complet',
            'date',
            'programme',
            'denombrement',
            'commentaire',
            'commune',
            'coordonnee_x',
            'coordonnee_y',
            ...Array.from(all_json_data_keys),
        ]);
        const blob = new Blob([csv_str], { type: 'text/csv' });
        saveAs(blob, 'mydata.csv');
    }

    onExportSites() {
        this.userService.exportSites(this.role_id);
    }

    onEditInfos(content): void {
        this.userService.getPersonalInfo().subscribe((data) => {
            this.personalInfo = data;
            this.initForm();
            this.modalRef = this.modalService.open(content, {
                size: 'lg',
                windowClass: 'add-obs-modal',
                centered: true,
            });
        });
    }

    onUpdatePersonalData(userForm) {
        userForm = _.omitBy(userForm, _.isNil);
        delete userForm.username;
        if (this.newAvatar && this.extentionFile) {
            userForm.avatar = this.userAvatar;
            userForm.extention = this.extentionFile;
        }
        this.userService.updatePersonalData(userForm).subscribe((user: any) => {
            localStorage.setItem('userAvatar', user.features.avatar);
            this.modalRef.close();
        });
    }

    onUploadAvatar($event) {
        if ($event) {
            if ($event.target.files && $event.target.files[0]) {
                const file = $event.target.files[0];
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
                        newImage.height / MainConfig.imageUpload.maxHeight;
                    if (maxHeightRatio > 1) {
                        resizeTimeNumber = maxHeightRatio;
                    }
                    const maxWidthRatio =
                        newImage.width / MainConfig.imageUpload.maxWidth;
                    if (maxWidthRatio > 1 && maxWidthRatio > maxHeightRatio) {
                        resizeTimeNumber = maxWidthRatio;
                    }

                    canvas.width = newImage.width / resizeTimeNumber;
                    canvas.height = newImage.height / resizeTimeNumber;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const resizedImage = canvas.toDataURL(
                        'image/jpeg',
                        MainConfig.imageUpload.quality
                    );

                    this.userAvatar = resizedImage;
                    this.newAvatar = resizedImage;
                    this.extentionFile = 'jpeg';
                };
                img.src = window.URL.createObjectURL(file);
            }
        }
    }

    initForm() {
        this.userForm = this.formBuilder.group(
            {
                username: [
                    {
                        value: this.personalInfo.features.username,
                        disabled: true,
                    },
                ],
                email: [
                    this.personalInfo.features.email,
                    [
                        Validators.required,
                        Validators.pattern(
                            "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
                        ),
                    ],
                ],
                name: [this.personalInfo.features.name, Validators.required],
                surname: [
                    this.personalInfo.features.surname,
                    Validators.required,
                ],
                newPassword: [null],
                confirmPassword: [null],
            },
            {
                validator: CustomFormValidator.MatchPassword,
            }
        );
    }

    openDeleteModal(deleteModal: any, idObs: number) {
        this.idObsToDelete = idObs;
        this.modalRefDel = this.modalService.open(deleteModal, {
            windowClass: 'delete-modal',
            centered: true,
        });
    }

    onCancelDelete() {
        this.modalRefDel.close();
    }

    onDeleteObs() {
        this.userService
            .deleteObsservation(this.idObsToDelete)
            .subscribe(() => {
                this.modalRefDel.close();
                this.getData();
                this.idObsToDelete = null;
            });
    }

    openSiteDeleteModal(deleteModal: any, idSite: number) {
        this.idSiteToDelete = idSite;
        this.modalRefDel = this.modalService.open(deleteModal, {
            windowClass: 'delete-modal',
            centered: true,
        });
    }

    onSiteCancelDelete() {
        this.modalRefDel.close();
    }

    onDeleteSite() {
        this.userService.deleteSite(this.idSiteToDelete).subscribe(() => {
            this.modalRefDel.close();
            this.mysites = null;
            this.getData();
            this.idSiteToDelete = null;
        });
    }

    ngOnDestroy(): void {
        if (this.modalRef) this.modalRef.close();
        if (this.modalRefDel) this.modalRefDel.close();
        this.flowService.setModalCloseSatus(null);
    }
}
