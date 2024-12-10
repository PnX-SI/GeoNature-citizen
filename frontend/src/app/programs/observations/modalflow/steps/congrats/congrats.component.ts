import { COMPILER_OPTIONS, Component, Input, ViewEncapsulation } from '@angular/core';
import { IFlowComponent } from '../../flow/flow';
import { MainConfig } from '../../../../../../conf/main.config';
import { TaxhubService } from 'src/app/api/taxhub.service';

@Component({
    templateUrl: './congrats.component.html',
    styleUrls: ['./congrats.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class CongratsComponent implements IFlowComponent {
    @Input() data: any;
    timeout: any;
    username: string;
    obs: any;
    photoPath: string =  'assets/default_program.jpg';
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
        this.obs = this.data.obs.properties;
        if (this.obs.photos && this.obs.photos.length > 0) {
            this.photoPath = MainConfig.API_ENDPOINT + '/' + this.obs.photos[0].url;
        } else if (this.obs.medias && this.obs.medias.length > 0){
            this.photoPath = this.obs.medias[0].media_url
        }
        this.timeout = setTimeout(() => {
            this.data.next(this.data);
        }, 5000);
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
