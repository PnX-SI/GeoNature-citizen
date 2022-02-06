import { Component, ViewEncapsulation, ViewChild, Input } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { ObserversListComponent } from './list/observers-list.component';

@Component({
    selector: 'admin-observers',
    templateUrl: './admin-observers.component.html',
    styleUrls: [
        '../../../home/home.component.css',
        './admin-observers.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AdminObserversComponent {
    title = 'Observations';
    @Input('observers') observers: FeatureCollection;
    @Input('areas') areas: FeatureCollection;
    @Input('userDashboard') userDashboard = false;
    @Input('admin') admin = false;
    @Input('relaysList') relaysList = [];
    @ViewChild(ObserversListComponent, { static: true })
    observersList: ObserversListComponent;
}
