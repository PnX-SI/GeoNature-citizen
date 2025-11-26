import { Component, OnInit } from '@angular/core';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { MediaPaginatedList, MediaList } from './media-galery.model';
import { Input } from '@angular/core';
import { MainConfig } from '../../../conf/main.config';
import { objectCleaner } from '../../api/utils.service';
import { AuthService } from '../../../app/auth/auth.service';

declare let $: any;

@Component({
    selector: 'app-media-galery',
    templateUrl: './media-galery.component.html',
    styleUrls: ['./media-galery.component.scss'],
})
export class MediaGaleryComponent implements OnInit {
    private readonly API_ENDPOINT = MainConfig.API_ENDPOINT;
    media: MediaList;
    hasMedia: boolean;
    clickedPhoto: any;
    @Input('program_id') program_id: number;
    @Input('validationProcess') validation_process: boolean;
    @Input('userDashboard') userDashboard: boolean;

    constructor(
        private programService: GncProgramsService,
        private auth: AuthService
    ) { }

    ngOnInit(): void {
        const initParams: { [index: string]: string } = {
            id_program: this.program_id ? this.program_id.toString() : null,
        };
        if (this.validation_process) {
            initParams.validation_status__notequal = 'VALIDATED';
            initParams.validation_process = 'true';
        }
        if (this.userDashboard) {
            initParams.id_role = this.auth.getUserInfo()
                ? this.auth.getUserInfo()['id_role']
                : null;
        }
        const params = objectCleaner(initParams);
        this.programService
            .getMedias(params)
            .subscribe((data: MediaPaginatedList) => {
                this.media = data.items;
                this.hasMedia = this.media.length > 0;
            });
    }

    showPhoto(photo) {
        this.clickedPhoto = photo;
        $('#photoModal').modal('show');
    }
}
