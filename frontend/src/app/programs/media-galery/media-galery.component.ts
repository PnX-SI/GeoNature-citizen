import { Component, OnInit } from '@angular/core';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { MediaList } from './media-galery.model';
import { Input } from '@angular/core';
import { MainConfig } from '../../../conf/main.config';

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

    constructor(private programService: GncProgramsService) {}

    ngOnInit(): void {
        this.programService
            .getMedias({ id_program: this.program_id, no_pagination: true })
            .subscribe((media) => {
                console.debug('MEDIA', typeof media);
                console.log('this.media', typeof this.media);
                this.media = media;
                this.hasMedia = this.media.length > 0;
            });
    }

    showPhoto(photo) {
        // console.log('opening photo:');
        // console.log(photo);
        this.clickedPhoto = photo;
        $('#photoModal').modal('show');
    }
}
