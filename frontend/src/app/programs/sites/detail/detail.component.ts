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

const map_conf = {
    BASE_LAYERS: MainConfig['BASEMAPS'].reduce((acc, baseLayer: Object) => {
        const layerConf: any = {
            name: baseLayer['name'],
            attribution: baseLayer['attribution'],
            detectRetina: baseLayer['detectRetina'],
            maxZoom: baseLayer['maxZoom'],
            bounds: baseLayer['bounds'],
            apiKey: baseLayer['apiKey'],
            layerName: baseLayer['layerName'],
        };
        if (baseLayer['subdomains']) {
            layerConf.subdomains = baseLayer['subdomains'];
        }
        acc[baseLayer['name']] = L.tileLayer(baseLayer['layer'], layerConf);
        return acc;
    }, {}),
    DEFAULT_BASE_MAP: () => 
        map_conf.BASE_LAYERS[MainConfig['DEFAULT_PROVIDER']],
};

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

    flatObject(myObject: object): object {
        const myObjectKeys = Object.keys(myObject);
        let myFlatObject = { ...myObject };
        myObjectKeys.forEach((key) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    myFlatObject[key],
                    'type'
                ) &&
                Object.prototype.hasOwnProperty.call(
                    myFlatObject[key],
                    'properties'
                ) &&
                myFlatObject[key]['type'] === 'object'
            ) {
                myFlatObject = {
                    ...myFlatObject[key]['properties'],
                    ...myFlatObject,
                };
                delete myFlatObject[key];
            }
        });

        return myFlatObject;
    }

    prepareSiteData(): void {
        // setup map
        const map = L.map('map', {
            layers: [map_conf.DEFAULT_BASE_MAP()],
        } as any);
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
                    json_data: e.json_data,
                };
                this.loadJsonSchema().subscribe((jsonschema: any) => {
                    const schema = jsonschema.schema.properties;
                    const custom_data = [];
                    const flattenSchema = this.flatObject(schema);
                    const flattenData = this.flatObject(data);
                    for (const k in flattenData) {
                        const v = flattenData[k];
                        if (
                            typeof flattenSchema[k] != 'undefined' &&
                            Object.prototype.hasOwnProperty.call(
                                flattenSchema[k],
                                'title'
                            )
                        ) {
                            custom_data.push({
                                name: flattenSchema[k]['title'],
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
