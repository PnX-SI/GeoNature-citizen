import { Component, Inject, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { debounceTime, catchError, map } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RegisterUser } from '../models';
import { AuthService } from './../auth.service';
import { AppConfig } from '../../../conf/app.config';

declare global {
    interface Window {
        hcaptcha: any;
    }
}
window.hcaptcha = window.hcaptcha || null;

@Component({
    selector: 'register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
    readonly AppConfig = AppConfig;
    user: RegisterUser = new RegisterUser();
    private _error = new Subject<string>();
    private _success = new Subject<string>();
    staticAlertClosed = false;
    errorMessage: string;
    locale: string;
    successMessage: string;
    userAvatar: string | ArrayBuffer;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private auth: AuthService,
        private router: Router,
        public activeModal: NgbActiveModal
    ) {
        this.locale = localeId;
    }

    ngAfterViewInit(): void {
        this.loadCaptchaScript();
    }

    onRegister(): void {
        this.auth
            .register(this.user)
            .pipe(
                map((user) => {
                    if (user) {
                        const message = user.message;
                        this._success.subscribe(
                            (message) => (this.successMessage = message)
                        );
                        this._success.pipe(debounceTime(5000)).subscribe(() => {
                            this.successMessage = null;
                            this.activeModal.close();
                        });

                        this.displaySuccessMessage(message);
                        // redirect ?
                        if (this.auth.redirectUrl) {
                            this.router.navigate([this.auth.redirectUrl]);
                        }
                    }
                }),
                catchError(this.handleError.bind(this))
            )
            .subscribe(
                (_data) => {},
                (errorMessage) => {
                    console.error('errorMessage', errorMessage);
                    this.errorMessage = errorMessage;
                    this.displayErrorMessage(errorMessage);
                }
            );
    }

    handleError(error) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            console.error('client-side error');
            // client-side or network error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // server-side error
            if (error.error && error.error.message) {
                // api error
                console.error('api error', error);
                errorMessage = error.error.message;
            } else {
                console.error('server-side error', error);
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
            this.resetCaptcha();
        }
        return throwError(errorMessage);
    }

    displayErrorMessage(message) {
        this._error.next(message);
    }

    displaySuccessMessage(message) {
        this._success.next(message);
    }

    onUploadAvatar($event) {
        if ($event) {
            if ($event.target.files && $event.target.files[0]) {
                const reader = new FileReader();
                const file = $event.target.files[0];
                reader.readAsDataURL(file);
                reader.onload = () => {
                    this.userAvatar = reader.result;
                    this.user.avatar = this.userAvatar;
                    this.user.extention = $event.target.files[0].type
                        .split('/')
                        .pop();
                };
            }
        }
    }

    loadCaptchaScript() {
        if (!AppConfig.HCAPTCHA_SITE_KEY) {
            return;
        }
        const node = document.createElement('script');
        node.id = 'hcaptcha-script';

        if (window.hcaptcha === null) {
            node.type = 'text/javascript';
            node.async = true;
            node.onload = function () {
                this.renderCaptcha();
            }.bind(this);
            node.src = 'https://hcaptcha.com/1/api.js?hl=' + this.locale;
            document.getElementsByTagName('head')[0].appendChild(node);
        } else {
            this.renderCaptcha();
        }
    }

    resetCaptcha() {
        if (window.hcaptcha === null) {
            return;
        }
        this.user.captchaToken = null;
        window.hcaptcha.reset();
    }

    renderCaptcha() {
        if (window.hcaptcha === null) {
            return;
        }
        window.hcaptcha.render('h-captcha', {
            sitekey: AppConfig.HCAPTCHA_SITE_KEY,
            callback: this.captchaCallback.bind(this),
        });
    }

    captchaCallback(token) {
        this.user.captchaToken = token;
    }
}
