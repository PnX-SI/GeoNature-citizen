import { COMPILER_OPTIONS, Component, Input, ViewEncapsulation } from '@angular/core';
import { IFlowComponent } from '../../flow/flow';
import { MainConfig } from '../../../../../../conf/main.config';
import { TaxhubService } from '../../../../../api/taxhub.service';
import { ObservationProperties } from '../../../observation.model';

const DEFAULT_PHOTO_PATH = 'assets/default_program.jpg';
const DEFAULT_TIMEOUT = 5000;

@Component({
    templateUrl: './congrats.component.html',
    styleUrls: ['./congrats.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class CongratsComponent implements IFlowComponent {
    @Input() data: any;
    timeout: any;
    username: string;
    observationProperties: ObservationProperties;
    photoPath: string = DEFAULT_PHOTO_PATH;
    MainConfig = MainConfig;

    constructor(private _taxhubService: TaxhubService) {}

    ngOnDestroy(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    ngOnInit(): void {
        this.username = localStorage.getItem('username');
        this.data.obs = this._taxhubService.filterMediasTaxhub(this.data.obs)
        this.observationProperties = this.data.obs.properties;
        if (this.observationProperties.photos && this.observationProperties.photos.length > 0) {
            this.photoPath = MainConfig.API_ENDPOINT + '/' + this.observationProperties.photos[0].url;
        } else if (this.observationProperties.medias && this.observationProperties.medias.length > 0){
            this.photoPath = this.observationProperties.medias[0].media_url
        }
        this.timeout = setTimeout(() => {
            this.data.next(this.data);
        }, DEFAULT_TIMEOUT);
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
