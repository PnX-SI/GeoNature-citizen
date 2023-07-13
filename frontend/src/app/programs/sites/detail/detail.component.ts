import { Component, AfterViewInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { SiteModalFlowService } from '../modalflow/modalflow.service';
import { MainConfig } from '../../../../conf/main.config';
import { HttpClient } from '@angular/common/http';
import {
    BaseDetailComponent,
    markerIcon,
} from '../../base/detail/detail.component';
import { UserService } from '../../../auth/user-dashboard/user.service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SiteService } from '../sites.service';

@Component({
    selector: 'app-site-detail',
    templateUrl: '../../base/detail/detail.component.html',
    styleUrls: [
        './../../observations/obs.component.css', // for form modal only
        '../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class SiteDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit
{
    idVisitToDelete = null;
    modalDelVisitRef = null;
    @ViewChild('visitDeleteModal', { static: true }) visitDeleteModal;
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        private userService: UserService,
        private modalService: NgbModal,
        public flowService: SiteModalFlowService,
        public siteService: SiteService
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.site_id = params['site_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'sites';
        this.username = localStorage.getItem('username');
        this.flowService.modalCloseStatus.subscribe( value => {
            if (value === 'visitPosted') {
                this.updateData();
            }
        });
        this.siteService.siteEdited.subscribe(value => {
            this.updateData();
        });
    }

    prepareVisits() {
        // photos
        this.photos = this.site.properties.photos;
        this.photos.forEach((e, i) => {
            this.photos[i]['url'] =
                MainConfig.API_ENDPOINT + this.photos[i]['url'];
        });
        // data
        this.attributes = []
        if (this.site.properties.visits) {
            this.site.properties.visits.forEach((e) => {
                const data = e.json_data;
                const visitData = {
                    date: e.date,
                    author: e.author,
                    id: e.id_visit,
                    json_data: e.json_data
                };
                this.loadJsonSchema().subscribe((jsonschema: any) => {
                    const schema = jsonschema.schema.properties;
                    const custom_data = [];
                    for (const k in data) {
                        const v = data[k];
                        custom_data.push({
                            name: schema[k].title,
                            value: v.toString(),
                        });
                    }
                    if (custom_data.length > 0) {
                        visitData['data'] = custom_data;
                    }
                });
                this.attributes.push(visitData);
            });
        }
    }

    getData() {
        return this.programService.getSiteDetails(this.site_id);
    }

    updateData() {
        this.getData().subscribe((sites) => {
            this.site = sites['features'][0];
            this.prepareVisits();
        });
    }

    ngAfterViewInit() {
        this.programService.getSiteDetails(this.site_id).subscribe((sites) => {
            this.site = sites['features'][0];
            this.photos = this.site.properties.photos;
            this.photos.forEach((e, i) => {
                this.photos[i]['url'] =
                    MainConfig.API_ENDPOINT + this.photos[i]['url'];
            });

            // setup map
            const map = L.map('map');
            L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap',
            }).addTo(map);

            let coord: number[];
            let latLng: L.LatLng;
            const geometryType = this.site.properties.program.geometry_type;

            switch (geometryType) {
                case 'POINT':
                default:
                    coord = this.site.geometry.coordinates;
                    latLng = L.latLng(coord[1], coord[0]);
                    L.marker(latLng, { icon: markerIcon }).addTo(map);
                    break;

                case 'LINESTRING':
                    coord = this.site.geometry.coordinates[0];
                    latLng = L.latLng(coord[1], coord[0]);
                    const lineLatLng = this.site.geometry.coordinates.map(
                        (c: number[]) => [c[1], c[0]]
                    );
                    L.polyline(lineLatLng, {
                        color: '#11aa9e',
                    }).addTo(map);
                    break;

                case 'POLYGON':
                    coord = this.site.geometry.coordinates[0][0];
                    latLng = L.latLng(coord[1], coord[0]);
                    const polygonLatLng = [this.site.geometry.coordinates[0].map(
                        (c: number[]) => [c[1], c[0]]
                    )] as L.LatLng[][];
                    L.polygon(polygonLatLng, {
                        color: '#11aa9e',
                    }).addTo(map);
                    break;
            }
            map.setView(latLng, 13);

            // prepare data
            if (this.site.properties.visits) {
                this.site.properties.visits.forEach((e) => {
                    const data = e.json_data;
                    const visitData = { date: e.date, author: e.author };
                    this.loadJsonSchema().subscribe((jsonschema: any) => {
                        const schema = jsonschema.schema.properties;
                        const custom_data = [];
                        for (const k in data) {
                            const v = data[k];
                            custom_data.push({
                                name: schema[k].title,
                                value: v.toString(),
                            });
                        }
                        if (custom_data.length > 0) {
                            visitData['data'] = custom_data;
                        }
                    });
                    this.attributes.push(visitData);
                });
            }
        });
    }

    loadJsonSchema() {
        return this.http.get(`${this.URL}/sites/${this.site_id}/jsonschema`);
    }

    addSiteVisit() {
        this.flowService.addSiteVisit(this.site_id);
    }

    editSiteVisit(visit_data) {
        visit_data.photos = this.photos.filter((p) => p.visit_id === visit_data.id)
        this.flowService.editSiteVisit(this.site_id, visit_data.id, visit_data);
    }

    openDelVisitModal(idVisitToDelete) {
        this.idVisitToDelete = idVisitToDelete;
        this.modalDelVisitRef = this.modalService.open(this.visitDeleteModal, {
            windowClass: 'delete-modal',
            centered: true,
        });
    }

    visitDeleteModalClose() {
        this.modalDelVisitRef.close();
    }

    deleteSiteVisit(idVisitToDelete) {
        this.userService.deleteSiteVisit(idVisitToDelete).subscribe(() => {
            this.updateData();
        });
    }
}
