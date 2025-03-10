import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { MainConfig } from '../../../../conf/main.config';
import { HttpClient } from '@angular/common/http';
import {
    BaseDetailComponent,
    markerIcon,
} from '../../base/detail/detail.component';

declare let $: any;

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
    selector: 'app-obs-detail',
    templateUrl: '../../base/detail/detail.component.html',
    styleUrls: [
        './../../observations/obs.component.css', // for form modal only
        '../../base/detail/detail.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class ObsDetailComponent
    extends BaseDetailComponent
    implements AfterViewInit {
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private programService: GncProgramsService
    ) {
        super();
        this.route.params.subscribe((params) => {
            this.obs_id = params['obs_id'];
            this.program_id = params['program_id'];
        });
        this.module = 'observations';
    }

    ngAfterViewInit() {
        this.programService.getObsDetails(this.obs_id).subscribe((obs) => {
            this.obs = obs;
            console.log(obs)
            this.photos = [];
            this.photos = this.obs.properties.photos.map(
                item => {
                    item['url'] = MainConfig.API_ENDPOINT + item['url']
                    return item
                });

            // setup map
            const map = L.map('map', {
                layers: [map_conf.DEFAULT_BASE_MAP()],
            } as any);

            let coord = this.obs.geometry.coordinates;
            let latLng = L.latLng(coord[1], coord[0]);
            map.setView(latLng, 13);

            L.marker(latLng, { icon: markerIcon }).addTo(map);

            // prepare data
            if (this.obs.properties.json_data) {
                const data = this.obs.properties.json_data;
                this.loadJsonSchema().subscribe((customform: any) => {
                    const schema = customform.json_schema.schema.properties;
                    this.attributes = this.formatData(data, schema);
                });
            }
        });
    }

    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/programs/${this.program_id}/customform/`
        );
    }

    flatObject(object: object): object {
        const flatObjectKeys = Object.keys(object);
        let flatObject = { ...object };

        flatObjectKeys.forEach(key => {
            if (
                flatObject[key].type === 'object' &&
                Object.prototype.hasOwnProperty.call(
                    flatObject[key],
                    'properties'
                )
            ) {
                flatObject = {
                    ...flatObject[key].properties,
                    ...flatObject,
                };
                delete flatObject[key];
            }
        });

        return flatObject;
    }

    formatData(data: any, schema: any): any[] {
        const formattedData: any[] = [];
        this.flattenObject(data, schema, formattedData);
        return formattedData;
    }

    flattenObject(
        object: any,
        schema: any,
        formattedData: Array<{
            name: string;
            value: string | string[];
            showDetails: boolean;
            type: string;
        }>
    ): void {
        const flatSchema = this.flatObject(schema);
        const flatObject = this.flatObject(object);

        for (const key in flatObject) {
            if (Object.prototype.hasOwnProperty.call(flatSchema, key)) {
                const value = flatObject[key];
                const propSchema = flatSchema[key];

                if (Array.isArray(value)) {
                    const isArrayType = propSchema.type === 'array';
                    const listFormattedString = value.map(item =>
                        this.formatArrayItem(item, propSchema.items.properties)
                    );
                    formattedData.push({
                        name: propSchema.title,
                        value: listFormattedString,
                        showDetails: isArrayType,
                        type: propSchema.type,
                    });
                } else if (typeof value === 'object') {
                    this.flattenObject(
                        value,
                        propSchema.items.properties,
                        formattedData
                    );
                } else {
                    const propName = propSchema.title;
                    const isArrayType = propSchema.type === 'array';
                    formattedData.push({
                        name: propName,
                        value:
                            typeof value === 'boolean'
                                ? value
                                    ? 'Oui'
                                    : 'Non'
                                : value.toString(),
                        showDetails: isArrayType,
                        type: propSchema.type,
                    });
                }
            }
        }
    }

    formatArrayItem(item: any, schema: any): string {
        let formattedString = '';

        for (const key in item) {
            const nestedValue = item[key];
            const nestedSchema = schema[key];

            formattedString += `<p>${
                nestedSchema.title
            }: ${nestedValue.toString()}</p>`;
        }

        return formattedString;
    }
}
