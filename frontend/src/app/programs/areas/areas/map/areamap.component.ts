import * as L from 'leaflet';
import { AppConfig } from '../../../../../conf/app.config';

import {
    Component,
    ComponentFactoryResolver,
    Injector,
    Input,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
    OnInit,
} from '@angular/core';
import { BaseMapComponent, conf } from './map.component';
import { MapService } from '../../../base/map/map.service';
import { AreaService } from '../../areas.service';
import { MAP_CONFIG } from '../../../../../conf/map.config';
import { GncProgramsService } from '../../../../api/gnc-programs.service';

@Component({
    selector: 'app-areas-map',
    template: `
        <div
            [id]="'areasMap'"
            class="obsMap"
            #map
            data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre zone."
        ></div>
    `,
    styleUrls: ['../../../base/map/map.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AreasMapComponent extends BaseMapComponent implements OnInit {
    feature_id_key = 'id_area';

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private areaService: AreaService,
        programService: GncProgramsService,
        resolver: ComponentFactoryResolver,
        injector: Injector,
        mapService: MapService
    ) {
        super(resolver, injector, mapService, programService);
    }

    ngOnInit() {
        this.areaService.newSpeciesSiteCreated.subscribe((speciesSite) => {
            this.observationMap.addLayer(
                L.geoJSON(speciesSite, {
                    pointToLayer: (_feature, latlng): L.Marker => {
                        return L.marker(latlng, {
                            icon: L.icon({
                                iconUrl: MAP_CONFIG.SPECIES_SITE_POINTER,
                                iconSize: [48, 48],
                                iconAnchor: [24, 48],
                            }),
                        });
                    },
                })
            );
        });
    }

    getPopupComponentFactory(): any {
        return this.resolver.resolveComponentFactory(AreaMarkerPopupComponent);
    }
}

@Component({
    selector: 'popup',
    template: `
        <ng-container>
            <span></span>
            <p>
                <b>{{ data.name }}</b
                ><br />
                <span> Ajoutée par {{ data.obs_txt }} </span><br />
            </p>
            <div
                [routerLink]="[
                    '/programs',
                    data.id_program,
                    'areas',
                    data.id_area
                ]"
                style="cursor:pointer"
                title="Voir les détails de cette zone"
            >
                <img class="icon" src="assets/binoculars.png" />
            </div>
        </ng-container>
    `,
})
export class AreaMarkerPopupComponent {
    @Input() data;
    public appConfig = AppConfig;
}
