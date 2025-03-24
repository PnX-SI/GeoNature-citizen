import { AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { Point } from 'geojson';

export function ngbDateMaxIsToday(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const today = new Date();
        const selected = NgbDate.from(control.value);
        if (!selected) return { 'Null date': true };
        const date_impl = new Date(
            selected.year,
            selected.month - 1,
            selected.day
        );
        return date_impl > today
            ? { 'Parsed a date in the future': true }
            : null;
    };
}

const isValidGeoJSONPoint = (geometry: any): geometry is Point => {
    return (
        geometry &&
        geometry.type === 'Point' &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length === 2 &&
        geometry.coordinates.every((coord) => typeof coord === 'number') &&
        geometry.coordinates.every((coord) => coord >= -180 && coord <= 180)
    );
};

export function geometryValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        console.log('geometryValidator', control);
        return isValidGeoJSONPoint(control.value)
            ? null
            : { geometry: { value: control.value } };
    };
}
