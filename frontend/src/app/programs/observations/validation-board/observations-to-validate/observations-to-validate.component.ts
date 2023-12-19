import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ViewChildren,
    QueryList,
    HostListener,
    Inject,
    LOCALE_ID,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FeatureCollection } from 'geojson';


import { ObsComponent } from '../../obs.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Point } from 'leaflet';
import { ObsMapComponent } from '../../map/map.component';


@Component({
    selector: 'observations-to-validate',
    templateUrl: '../../obs.component.html',
    styleUrls: [
        '../../obs.component.css',
        '../../../../home/home.component.css',
    ],
    encapsulation: ViewEncapsulation.None,
})
export class ObsToValidateComponent extends ObsComponent implements OnInit{
    @ViewChild(ObsMapComponent, { static: true }) obsMap: ObsMapComponent;
    @Input('observations') observations;
    @Output() deleteObs = new EventEmitter();
    @Output() validateObs = new EventEmitter();
    validationDashboard = true;

    ngOnInit() {
        this.breakpointObserver
            .observe(['(min-width: 700px)'])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this.isMobile = false;
                } else {
                    this.isMobile = true;
                }
            });
    }
}
