import { Component, OnInit } from '@angular/core';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { MediaList } from './media-galery.model';
import { Input } from '@angular/core';

@Component({
    selector: 'app-media-galery',
    templateUrl: './media-galery.component.html',
    styleUrls: ['./media-galery.component.scss']
})
export class MediaGaleryComponent implements OnInit {
    media: MediaList;
    @Input('program_id') program_id: number;

    constructor(private programService: GncProgramsService) { }

    ngOnInit(): void {
        this.programService
            .getObsMedias({ id_program: this.program_id })
            .subscribe((media) => {
                console.debug('MEDIA', typeof media);
                console.log('this.media', typeof this.media);
                this.media = media;
            });
    }
}
