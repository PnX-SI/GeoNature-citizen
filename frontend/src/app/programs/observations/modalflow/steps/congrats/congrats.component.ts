import { COMPILER_OPTIONS, Component, Input, ViewEncapsulation } from '@angular/core';
import { IFlowComponent } from '../../flow/flow';
import { MainConfig } from '../../../../../../conf/main.config';

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
    photoPath: string =  MainConfig.API_ENDPOINT +'/assets/default_program.jpg';
    MainConfig = MainConfig;

    constructor() {}

    ngOnDestroy(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    ngOnInit(): void {
        this.username = localStorage.getItem('username');
        this.obs = this.data.obs.properties;
        if (this.obs.photos && this.obs.photos.length > 0) {
            this.photoPath = MainConfig.API_ENDPOINT + '/' + this.obs.photos[0].url;
        }
        this.timeout = setTimeout(() => {
            this.data.next(this.data);
        }, 10000);
    }

    closeModal() {
        this.data.service.closeModal();
    }
}
