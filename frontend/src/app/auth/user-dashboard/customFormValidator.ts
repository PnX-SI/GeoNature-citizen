import { AbstractControl} from '@angular/forms';

export class CustomFormValidator{

    static password(control: AbstractControl){
        var regEx = /^(?=.*[0-9]+.*)(?=.*[A-Z])(?=.*[a-z])[0-9a-zA-Z]{5,}$/;
        var valid = regEx.test(control.value);
        return valid ? null : { password: true };
    }


    static MatchPassword(AC: AbstractControl) {
        const password = AC.get('newPassword').value; // to get value in input tag
        const confirmPassword = AC.get('confirmPassword').value; // to get value in input tag
        if (password !== confirmPassword) {
          return {MatchPassword: true};
        } else {
            return null
        }
    }

}
