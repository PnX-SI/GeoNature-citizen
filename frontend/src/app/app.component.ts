import {
    Component,
    OnInit,
    ViewEncapsulation,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MainConfig } from '../conf/main.config';
import { Router, NavigationStart } from '@angular/router';
import { ModalsTopbarService } from './core/topbar/modalTopbar.service';
import { TaxhubService } from './api/taxhub.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
    title = 'GeoNature-citizen';
    public MainConfig: any;
    public backgroundImage: any;
    hideTopbar = false;
    hideFooter = false;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private route: ActivatedRoute,
        private router: Router,
        private metaTagService: Meta,
        private titleService: Title,
        private modalService: ModalsTopbarService,
        private _taxhubService: TaxhubService,
    ) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.modalService.close();
            }
        });
        this.route.queryParams.subscribe((params) => {
            this.hideTopbar = 'hideTopbar' in params;
            this.hideFooter = 'hideFooter' in params;
        });
    }

    ngOnInit() {
        this.MainConfig = MainConfig;
        this.backgroundImage =
            MainConfig.API_ENDPOINT + '/media/background.jpg';
        this.metaTagService.addTags([
            {
                name: 'keywords',
                content:
                    'GeoNature-citizen ' +
                    (this.MainConfig.META.keywords
                        ? this.MainConfig.META.keywords
                        : ''),
            },
            { name: 'robots', content: 'index, follow' },
            { name: 'author', content: 'collectif GeoNature' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            { charset: 'UTF-8' },
            { property: 'og:title', content: MainConfig.appName },
            {
                property: 'og:description',
                content: MainConfig.platform_teaser[this.localeId],
            },
            { property: 'og:image', content: this.backgroundImage },
            { property: 'og:url', content: MainConfig.URL_APPLICATION },
            { property: 'twitter:title', content: MainConfig.appName },
            {
                property: 'twitter:description',
                content: MainConfig.platform_teaser[this.localeId],
            },
            { property: 'twitter:image', content: this.backgroundImage },
        ]);
        this._taxhubService.loadAndCacheData();
    }
}
