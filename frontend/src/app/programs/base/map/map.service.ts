import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    coords: L.Point;
    line: L.Polyline;
    polygon: L.Polygon;
    coordsChange: Subject<L.Point> = new Subject<L.Point>();
    lineChange: Subject<L.Polyline> = new Subject<L.Polyline>();
    polygonChange: Subject<L.Polygon> = new Subject<L.Polygon>();

    constructor() {
        this.coordsChange.subscribe((value) => {
            this.coords = value;
        });
        this.lineChange.subscribe((value) => {
            this.line = value;
        });
        this.polygonChange.subscribe((value) => {
            this.polygon = value;
        });
    }

    changePoint(coords: L.Point): void {
        this.coordsChange.next(coords);
    }

    changeLine(line: L.Polyline): void {
        this.lineChange.next(line);
    }

    changePolygon(polygon: L.Polygon): void {
        this.polygonChange.next(polygon);
    }
}
