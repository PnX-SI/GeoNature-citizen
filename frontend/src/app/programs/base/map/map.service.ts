import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    coords: L.Point;
    line: L.Polyline;
    coordsChange: Subject<L.Point> = new Subject<L.Point>();
    lineChange: Subject<L.Polyline> = new Subject<L.Polyline>();

    constructor() {
        this.coordsChange.subscribe((value) => {
            this.coords = value;
        });
        this.lineChange.subscribe((value) => {
            this.line = value;
        });
    }

    changePoint(coords: L.Point): void {
        this.coordsChange.next(coords);
    }

    changeLine(line: L.Polyline): void {
        console.log('changeLine: line: ', line);
        this.lineChange.next(line);
    }
}
