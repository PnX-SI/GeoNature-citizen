import { AfterViewInit } from '@angular/core';
import { FeatureCollection, Feature } from 'geojson';
import { Program } from '../programs.models';
import * as L from 'leaflet';
import { MainConfig } from '../../../conf/main.config';
import { LoginComponent } from '../../auth/login/login.component';
import { AuthService } from '../../auth/auth.service';

export abstract class ProgramBaseComponent implements AfterViewInit {
    MainConfig = MainConfig;
    fragment: string;
    coords: L.Point;
    program_id: any;
    programs: Program[];
    program: Program;
    taxonomyListID: number;
    programFeature: FeatureCollection;
    protected modalService: any;
    abstract flowService: any;

    protected constructor(private authService: AuthService) {}

    ngAfterViewInit(): void {
        try {
            if (this.fragment) {
                document
                    .querySelector('#' + this.fragment)
                    .scrollIntoView({ behavior: 'smooth' });
            }
        } catch (e) {
            //alert(e);
        }
    }

    ngOnDestroy(): void {
        this.flowService.closeModal();
    }

    onMapClicked(p: L.Point): void {
        this.coords = p;
        console.debug('map clicked', this.coords);
    }

    verifyProgramPrivacyAndUser() {
        if (!this.program || !this.program.is_private) {
            return;
        }

        const token = this.authService.getAccessToken();
        if (
            (token && this.authService.tokenExpiration(token) > 1) ||
            !this.modalService
        ) {
            return;
        }

        const loginModalRef = this.modalService.open(LoginComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
            keyboard: false,
        });
        loginModalRef.componentInstance.canBeClosed = false;
        loginModalRef.result
            .then(this.loadData.bind(this))
            .catch(this.loadData.bind(this));
    }

    loadData() {}
}
