import * as L from 'leaflet';
import { AppConfig } from '../../../../conf/app.config';

import {
    Component,
    ComponentFactoryResolver,
    HostListener,
    Injector,
    Input,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
    Renderer2,
} from '@angular/core';
import { BaseMapComponent, conf } from '../../base/map/map.component';
import { MapService } from '../../base/map/map.service';

@Component({
    selector: 'app-obs-map',
    templateUrl: './map.component.html',
    // template: `
    //     <div
    //         [id]="'obsMap'"
    //         class="obsMap"
    //         i18n-data-observation-zoom-statement-warning="
    //             Zooming instruction@@zoomingInstruction"
    //         data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre observation."
    //         #map
    //     ></div>
    // `,
    styleUrls: ['../../base/map/map.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class ObsMapComponent extends BaseMapComponent {
    feature_id_key = 'id_observation';

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
        return this.resolver.resolveComponentFactory(MarkerPopupComponent);
    }

    @HostListener('document:NewObservationEvent', ['$event'])
    newObservationEventHandler(e: CustomEvent) {
        e.stopPropagation();
    }
}

@Component({
    selector: 'popup',
    template: `
        <ng-container>
            <img
                class="default-img"
                [src]="
                    data.image
                        ? data.image
                        : data.medias && !!data.medias.length
                        ? appConfig.API_TAXHUB +
                          '/tmedias/thumbnail/' +
                          data.medias[0].id_media +
                          '?h=80&v=80'
                        : 'assets/default_image.png'
                "
            />
            <p>
                <a
                    class="espece-link"
                    href="{{
                        appConfig.details_espece_url + data.taxref?.cd_nom
                    }}"
                    target="_blank"
                    >{{
                        !!data.nom_francais
                            ? data.nom_francais
                            : data.taxref?.nom_vern
                    }}</a
                >
                <br />
                <span>
                    <span *ngIf="appConfig.program_list_observers_names">
                        Observé par
                        {{
                            data.observer && data.observer.username
                                ? data.observer.username
                                : 'Anonyme'
                        }}
                        <br />
                    </span>
                    le {{ data.date }} </span
                ><br />
            </p>
            <a
                [routerLink]="[
                    '/programs',
                    data.id_program,
                    'observations',
                    data.id_observation
                ]"
                style="cursor:pointer"
                title="Voir les détails"
            >
                <div><img class="icon" src="assets/binoculars.png" /></div>
            </a>
        </ng-container>
    `,
})
export class MarkerPopupComponent {
    @Input() data;
    public appConfig = AppConfig;
}
