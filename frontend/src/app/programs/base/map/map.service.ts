import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    coords: L.Point;
    coordsChange: Subject<L.Point> = new Subject<L.Point>();

    constructor() {
        this.coordsChange.subscribe((value) => {
            this.coords = value;
        });
    }

    changePoint(coords: L.Point) {
        this.coordsChange.next(coords);
    }
}
