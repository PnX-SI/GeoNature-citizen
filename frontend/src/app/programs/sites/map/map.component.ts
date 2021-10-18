import * as L from 'leaflet';
import { AppConfig } from '../../../../conf/app.config';

import {
    Component,
    ComponentFactoryResolver,
    Injector,
    Input,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
    Renderer2,
} from '@angular/core';
import { BaseMapComponent } from '../../base/map/map.component';
import { MapService } from '../../base/map/map.service';

@Component({
    selector: 'app-sites-map',
    template: `
        <div
            [id]="'sitesMap'"
            class="obsMap"
            #map
            data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre site."
        ></div>
    `,
    styleUrls: ['../../base/map/map.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SitesMapComponent extends BaseMapComponent {
    feature_id_key = 'id_site';

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        resolver: ComponentFactoryResolver,
        injector: Injector,
        mapService: MapService,
        renderer2: Renderer2
    ) {
        super(resolver, injector, mapService, renderer2);
    }

    getPopupComponentFactory(): any {
        return this.resolver.resolveComponentFactory(SiteMarkerPopupComponent);
    }
}

@Component({
    selector: 'popup',
    template: `
        <ng-container>
            <img
                [src]="
                    data.photo
                        ? appConfig.API_ENDPOINT + data.photo.url
                        : 'assets/no_photo_light.png'
                "
            />
            <p>
                <b>{{ data.name }}</b
                ><br />
                <span
                    >Ajoutée par {{ data.obs_txt }}<br />
                    le
                    {{
                        data.timestamp_create.substring(0, 10)
                            | date: 'longDate'
                    }} </span
                ><br />
            </p>
            <div
                [routerLink]="[
                    '/programs',
                    data.id_program,
                    'sites',
                    data.id_site
                ]"
                style="cursor:pointer"
                title="Voir les détails sur ce site"
            >
                <img class="icon" src="assets/binoculars.png" />
            </div>
        </ng-container>
    `,
})
export class SiteMarkerPopupComponent {
    @Input() data;
    public appConfig = AppConfig;
}
