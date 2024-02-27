import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { SitesComponent } from '../../../programs/sites/sites.component';

@Component({
    selector: 'user-sites',
    templateUrl: '../../../programs/sites/sites.component.html',
    styleUrls: [
        '../../../programs/sites/sites.component.css',
        '../../../home/home.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class UserSitesComponent extends SitesComponent implements OnInit {
    @Input('mysites') mySites;
    userDashboard = true;

    ngOnInit() {
        this.sites = this.mySites;
    }
}
