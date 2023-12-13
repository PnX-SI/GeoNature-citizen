import { AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';

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

export function geometryValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const validGeometry = /Point\(-{0,1}\d{1,3}(|\.\d{1,7}),(|\s)-{0,1}\d{1,3}(|\.\d{1,7})\)$/.test(
            control.value
        );
        return validGeometry ? null : { geometry: { value: control.value } };
    };
}
