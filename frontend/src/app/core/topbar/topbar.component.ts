import { Component, OnInit, Input, LOCALE_ID, Inject } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { tap, map, catchError, filter } from 'rxjs/operators';

import { MainConfig } from '../../../conf/main.config';
import { AuthService } from './../../auth/auth.service';
import { LoginComponent } from '../../auth/login/login.component';
import { LogoutComponent } from '../../auth/logout/logout.component';
import { RegisterComponent } from '../../auth/register/register.component';
import { ProgramsComponent } from '../../programs/programs.component';
import { Program } from '../../programs/programs.models';
import { GncProgramsService } from '../../api/gnc-programs.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalsTopbarService } from './modalTopbar.service';
import { LanguageService } from '../services/language.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.css'],
})
export class TopbarComponent implements OnInit {
    title: string = MainConfig.appName;
    // isLoggedIn: boolean = false;
    username: string;
    MainConfig = MainConfig;
    isCollapsed = true;
    programs$ = new Subject<Program[]>();
    isAdmin = false;
    isValidator = false;
    canDisplayAbout: boolean = MainConfig.about;
    canSignup: boolean = MainConfig.signup !== 'never';
    adminUrl: SafeUrl;
    userAvatar: string;
    logoImage: string;
    hideAuth = false;
    isOpen = false;

    supportedLocales: string[] = [];
    currentLocale: string;
    @Input()
    displayTopbar: boolean;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private route: ActivatedRoute,
        private programService: GncProgramsService,
        private auth: AuthService,
        private modalService: ModalsTopbarService,
        protected http: HttpClient,
        private languageService: LanguageService,
        private router: Router
    ) {
        const tmp = localStorage.getItem('username');
        this.username = tmp ? tmp.replace(/\"/g, '') : 'Anonymous';
        this.logoImage = MainConfig.API_ENDPOINT + '/media/logo.png';
        this.route.data
            .pipe(
                tap((data: { programs: Program[] }) => {
                    if (data && data.programs) {
                        this.programs$.next(data.programs);
                    } else {
                        // console.warn("topbar::getAllPrograms");
                        this.programService
                            .getAllPrograms()
                            .subscribe((programs) => {
                                this.programs$.next(programs);
                            });
                    }
                }),
                catchError((error) => throwError(error))
            )
            .subscribe();
        this.route.queryParams.subscribe((params) => {
            this.hideAuth = 'hideAuth' in params;
        });
    }

    isLoggedIn(): Observable<boolean> {
        return this.auth.authorized$.pipe(
            map((value) => {
                if (value === true) {
                    this.username = localStorage.getItem('username');
                    if (
                        localStorage.getItem('userAvatar') &&
                        localStorage.getItem('userAvatar') != 'null'
                    )
                        this.userAvatar =
                            MainConfig.API_ENDPOINT +
                            '/media/' +
                            localStorage.getItem('userAvatar');
                }
                return value;
            })
        );
    }

    login(): void {
        this.modalService.open(LoginComponent, {
            size: 'lg',
            centered: true,
        });
    }

    register(): void {
        this.modalService.open(RegisterComponent, {
            size: 'lg',
            centered: true,
        });
    }

    logout(): void {
        this.modalService.open(LogoutComponent, {
            size: 'lg',
            centered: true,
        });
    }

    programs(): void {
        this.modalService.open(ProgramsComponent, {
            size: 'lg',
            windowClass: 'programs-modal',
            centered: true,
        });
    }

    ngOnInit(): void {
        this.supportedLocales = this.languageService.getSupportedLocales();
        this.currentLocale   = this.languageService.getCurrentLocale();

        this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
            this.currentLocale = this.languageService.getCurrentLocale();
        });
        const access_token = localStorage.getItem('access_token');
        if (access_token) {
            this.auth.ensureAuthorized().subscribe(
                (user) => {
                    if (user && user['features'] && user['features'].id_role) {
                        this.username = user['features'].username;
                        this.isAdmin = user['features'].admin ? true : false;
                        this.isValidator = user['features'].validator;
                        if (this.isAdmin) {
                            const ADMIN_ENDPOINT = [
                                MainConfig.API_ENDPOINT,
                                // this.localeId,
                                'admin',
                                '',
                            ].join('/');
                            // const PROGRAM_ENDPOINT = ADMIN_ENDPOINT + "programsmodel/";
                            // this.adminUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                            //   PROGRAM_ENDPOINT + "?jwt=" + this.auth.getAccessToken()
                            // );
                            this.adminUrl = ADMIN_ENDPOINT;
                        }
                    }
                },
                (err) => {
                    console.error(err);
                    this.auth
                        .logout()
                        .then((logout) => {
                            // console.log('Logout Status:', logout.status);
                        })
                        .catch((err) => {
                            // console.error('Logout error:', err);
                        });
                    return throwError(err);
                }
            );
            /*this.auth.ensureAuthorized().pipe(
        tap(user => {
          console.log("ensureAuthorized result", user);
          if (user && user["features"] && user["features"].id_role) {
            this.username = user["features"].username;
            this.isAdmin = user["features"].admin ? true : false;
          }
        }),
        catchError(err => {
          console.error(err);
          this.auth
            .logout()
            .then(logout => {
              console.log("Logout Status:", logout.status);
            })
            .catch(err => {
              console.error("Logout error:", err);
            });
          return throwError(err);
        })
      );*/
        }
    }

    switchLanguage(newLocale: string): void {
        this.languageService.switchLanguage(newLocale);
    }
}
