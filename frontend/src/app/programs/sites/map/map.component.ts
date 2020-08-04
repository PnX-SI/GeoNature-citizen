import * as L from "leaflet";
import { AppConfig } from "../../../../conf/app.config";

import {
  Component,
  ComponentFactoryResolver,
  HostListener,
  Injector,
  Input,
  ViewEncapsulation,
  Inject,
  LOCALE_ID
} from "@angular/core";
import { BaseMapComponent, conf } from "../../base/map/map.component"
import { MapService } from "../../base/map/map.service"


@Component({
  selector: "app-sites-map",
  template: `
    <div
      [id]="options.MAP_ID"
      #map
      data-observation-zoom-statement-warning="Veuillez zoomer pour localiser votre site."
    ></div>
  `,
  styleUrls: ["./map.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SitesMapComponent extends BaseMapComponent {
  feature_id_key: "id_site";

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    resolver: ComponentFactoryResolver,
    injector: Injector,
    mapService: MapService
  ) {
    super(resolver, injector, mapService)
  }

  getPopupComponentFactory(): any {
    return this.resolver.resolveComponentFactory(SiteMarkerPopupComponent);
  }
}


@Component({
  selector: "popup",
  template: `
     <ng-container>
      <img [src]="(data.photo ? appConfig.API_ENDPOINT + data.photo.url : 'assets/no_photo_light.png')">
      <p>
        <b>{{ data.name }}</b><br>
        <span>Ajoutée par {{ data.obs_txt }}<br>
        le {{ data.timestamp_create.substring(0, 10) | date : "longDate" }}
        </span><br>
        <a [routerLink]="['/programs', data.id_program, 'sites', data.id_site]" style="cursor:pointer">
          + Voir les détails
        </a>
        </p>
      <div [routerLink]="['/programs', data.id_program, 'sites', data.id_site]" style="cursor:pointer" title="Voir les détails sur cette mare">
          <img class="icon" src="assets/binoculars.png">
      </div>
    </ng-container>
  `
})
export class SiteMarkerPopupComponent {
  @Input() data;
  public appConfig = AppConfig;
}
