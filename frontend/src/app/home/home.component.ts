import {
    Component,
    OnInit,
    AfterViewChecked,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title, Meta, SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MainConfig } from '../../conf/main.config';
import { ProgramsResolve } from '../programs/programs-resolve.service';
import { Program } from '../programs/programs.models';
import { ObservationsService } from '../programs/observations/observations.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    providers: [ProgramsResolve],
})
export class HomeComponent implements OnInit, AfterViewChecked {
    programs: Program[];
    fragment: string;
    platform_teaser: SafeHtml;
    platform_intro: SafeHtml;
    MainConfig = MainConfig;
    htmlContent: SafeHtml;
    stats: Object;
    backgroundImage: any;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private router: Router,
        private route: ActivatedRoute,
        private metaTagService: Meta,
        private titleService: Title,
        private observationsService: ObservationsService,
        protected domSanitizer: DomSanitizer,
        protected http: HttpClient
    ) {}

    ngOnInit() {
        this.route.data.subscribe((data: { programs: Program[] }) => {
            this.programs = data.programs;
            this.observationsService
                .getStat()
                .subscribe((stats) => (this.stats = stats));
            if (this.programs.length === 1) {
                const p = this.programs[0]
                this.router.navigate([
                    '/programs',
                    p.id_program,
                    p.module.name
                ]);
            }
        });
        this.route.fragment.subscribe((fragment) => {
            this.fragment = fragment;
        });

        this.backgroundImage = MainConfig.API_ENDPOINT + '/media/background.jpg';
        this.metaTagService.updateTag({
            name: 'description',
            content: this.MainConfig.platform_teaser.fr,
        });
        this.metaTagService.updateTag({
            property: 'og:title',
            content: MainConfig.appName,
        });
        this.metaTagService.updateTag({
            property: 'og:description',
            content: MainConfig.platform_teaser[this.localeId],
        });
        this.metaTagService.updateTag({
            property: 'og:image',
            content: this.backgroundImage,
        });
        this.metaTagService.updateTag({
            property: 'og:url',
            content: MainConfig.URL_APPLICATION + this.router.url,
        });
        this.metaTagService.updateTag({
            property: 'twitter:title',
            content: MainConfig.appName,
        });
        this.metaTagService.updateTag({
            property: 'twitter:description',
            content: MainConfig.platform_teaser[this.localeId],
        });
        this.metaTagService.updateTag({
            property: 'twitter:image',
            content: this.backgroundImage,
        });
        this.titleService.setTitle(this.MainConfig.appName);
        this.platform_intro = this.domSanitizer.bypassSecurityTrustHtml(
            MainConfig['platform_intro'][this.localeId]
        );
        this.platform_teaser = this.domSanitizer.bypassSecurityTrustHtml(
            MainConfig['platform_teaser'][this.localeId]
        );
    }

    ngAfterViewChecked(): void {
        try {
            if (this.fragment) {
                document.querySelector('#' + this.fragment).scrollIntoView({
                    behavior: 'smooth',
                });
            }
        } catch (e) {
            //alert(e);
        }
    }
}
