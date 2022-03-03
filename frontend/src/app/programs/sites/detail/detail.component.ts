import {
    Component,
    AfterViewInit,
    ViewEncapsulation,
    ViewChild,
} from '@angular/core';
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
        this.flowService.modalCloseStatus.subscribe((value) => {
            if (value === 'visitPosted') {
                this.updateData();
            }
        });
        this.siteService.siteEdited.subscribe((value) => {
            this.updateData();
        });
    }

    prepareSiteData(): void {
        // setup map
        const map = L.map('map');
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
        }).addTo(map);

        const coord = this.site.geometry.coordinates;
        const latLng = L.latLng(coord[1], coord[0]);
        map.setView(latLng, 13);

        L.marker(latLng, { icon: markerIcon }).addTo(map);
    }

    prepareVisits(): void {
        // photos
        this.photos = this.site.properties.photos;
        this.photos.forEach((e, i) => {
            this.photos[i]['url'] =
                MainConfig.API_ENDPOINT + this.photos[i]['url'];
        });
        // data
        this.attributes = [];
        if (this.site.properties.visits) {
            this.site.properties.visits.forEach((e) => {
                const data = e.json_data;
                const visitData = {
                    date: e.date,
                    author: e.author,
                    id: e.id_visit,
                    // json_data: e.json_data
                };
                this.loadJsonSchema().subscribe((jsonschema: any) => {
                    const schema = jsonschema.schema.properties;
                    console.log('schema', schema);
                    const custom_data = [];
                    const schemaKeys = Object.keys(schema);
                    let flattenSchema = schema;
                    schemaKeys.forEach((key) => {
                        console.log(
                            `schema ${key} (${flattenSchema[key].type}): ${flattenSchema[key]}`
                        );
                        if (flattenSchema[key].type === 'object') {
                            console.log(key, flattenSchema[key].properties);
                            flattenSchema = {
                                ...flattenSchema[key].properties,
                                ...flattenSchema,
                            };
                            delete flattenSchema[key];
                        }
                    });
                    console.log('flattenSchema', schema, flattenSchema);
                    const dataKeys = Object.keys(data);
                    let flattenData = data;
                    dataKeys.forEach((key) => {
                        if (typeof flattenData[key] === 'object') {
                            flattenData = {
                                ...flattenData,
                                ...flattenData[key],
                            };
                            delete flattenData[key];
                        }
                    });
                    console.log('flattenData', flattenData);
                    for (const k in flattenData) {
                        const v = flattenData[k];
                        console.log(flattenSchema[k].title, typeof v, v);
                        if (flattenSchema[k] != 'undefined') {
                            custom_data.push({
                                name: flattenSchema[k].title,
                                value:
                                    typeof v === 'boolean'
                                        ? v
                                            ? 'Oui'
                                            : 'Non'
                                        : v.toString(),
                            });
                        }
                    }
                    if (custom_data.length > 0) {
                        visitData['data'] = custom_data;
                    }
                });
                this.attributes.push(visitData);
            });
        }
        console.log('this.attributes', this.attributes);
    }

    getData() {
        return this.programService.getSiteDetails(this.site_id);
    }

    updateData(): void {
        this.getData().subscribe((sites) => {
            this.site = sites['features'][0];
            this.prepareVisits();
        });
    }

    ngAfterViewInit(): void {
        this.getData().subscribe((sites) => {
            this.site = sites['features'][0];
            this.prepareSiteData();
            this.prepareVisits();
        });
    }

    loadJsonSchema() {
        return this.http.get(`${this.URL}/sites/${this.site_id}/jsonschema`);
    }

    addSiteVisit() {
        this.flowService.addSiteVisit(this.site_id);
    }

    editSiteVisit(visit_data) {
        visit_data.photos = this.photos.filter(
            (p) => p.visit_id === visit_data.id
        );
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
