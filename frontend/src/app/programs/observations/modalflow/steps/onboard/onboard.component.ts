import {
    Component,
    ViewEncapsulation,
    Input,
    ViewChild,
    ElementRef,
    OnInit,
} from '@angular/core';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { IFlowComponent } from '../../flow/flow';
import { RegisterComponent } from '../../../../../auth/register/register.component';
import { LoginComponent } from '../../../../../auth/login/login.component';
import { MainConfig } from '../../../../../../conf/main.config';
import { AuthService } from '../../../../../auth/auth.service';

@Component({
    templateUrl: './onboard.component.html',
    styleUrls: ['./onboard.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class OnboardComponent implements IFlowComponent, OnInit {
    RegistrationModalRef: NgbModalRef;
    LoginModalRef: NgbModalRef;
    timeout: any;
    MainConfig = MainConfig;
    @Input('data') data: any;
    @ViewChild('RegisterComponent', { static: true })
    RegisterComponent: ElementRef;
    @ViewChild('LoginComponent', { static: true }) LoginComponent: ElementRef;

    constructor(
        private modalService: NgbModal,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.authService.authorized$.subscribe((value) => {
            if (value) {
                this.timeout = setTimeout(() => this.data.next(), 0);
            }
            if (MainConfig.signup === 'never') {
                this.continue();
            }
        });
    }

    // Actions
    register(): void {
        this.RegistrationModalRef = this.modalService.open(RegisterComponent, {
            centered: true,
        });
        this.RegistrationModalRef.result.then(() => {
            this.authService.isLoggedIn().subscribe(
                (value) => !!value,
                (reason) => {
                    console.debug('registration dismissed:', reason);
                }
            );
        });
    }

    login(): void {
        this.LoginModalRef = this.modalService.open(LoginComponent, {
            centered: true,
        });
        this.LoginModalRef.result.then((_) => {
            console.debug('[obs-flow] login resolved');
            this.authService.isLoggedIn().subscribe(
                (value) => !!value,
                (reason) => {
                    console.debug('login dismissed:', reason);
                }
            );
        });
    }

    continue(): void {
        if (this.data.registration_required) {
            return;
        }
        console.debug('continue');
        this.data.next();
    }

    closeModal(): void {
        this.data.service.closeModal();
    }
}
