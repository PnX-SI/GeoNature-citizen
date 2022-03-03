import {
    Component,
    ViewEncapsulation,
    Input,
} from '@angular/core';
import { ModalsTopbarService } from '../../../../core/topbar/modalTopbar.service';
import { MainConfig } from '../../../../../conf/main.config';

@Component({
    selector: 'app-obs-medias-modal',
    templateUrl: './photo_modal.component.html',
    styleUrls: ['./photo_modal.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class PhotosModalComponent {
    @Input('photos') photos;
    apiEndpoint = '';
    bigSize = false;

    constructor(private modalService: ModalsTopbarService) {
        this.apiEndpoint = MainConfig.API_ENDPOINT;
    }

    closeModal() {
        this.modalService.close();
    }

    openPhoto(url) {
        window.open(url);
    }
}
