import { LOCALE_ID, NgModule, Inject } from '@angular/core';
import {
    BrowserModule,
    BrowserTransferStateModule,
} from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AuthService } from './auth/auth.service';
import { AuthInterceptor } from './auth/auth.interceptor';
import { LoginComponent } from './auth/login/login.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { RegisterComponent } from './auth/register/register.component';
import { FooterComponent } from './core/footer/footer.component';
import { TopbarComponent } from './core/topbar/topbar.component';
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ProgramsComponent } from './programs/programs.component';
import { ObsFormComponent } from './programs/observations/form/form.component';
import { ObsListComponent } from './programs/observations/list/list.component';
import {
    ObsMapComponent,
    MarkerPopupComponent,
} from './programs/observations/map/map.component';
import { ObsComponent } from './programs/observations/obs.component';
import { SitesListComponent } from './programs/sites/list/list.component';
import {
    SitesMapComponent,
    SiteMarkerPopupComponent,
} from './programs/sites/map/map.component';
import { SitesComponent } from './programs/sites/sites.component';
import { SiteFormComponent } from './programs/sites/siteform/siteform.component';
import { SiteVisitFormComponent } from './programs/sites/form/form.component';
import { SiteDetailComponent } from './programs/sites/detail/detail.component';
import { ObsDetailComponent } from './programs/observations/detail/detail.component';
import { UserDashboardComponent } from './auth/user-dashboard/user-dashboard.component';
import { UserObsComponent } from './auth/user-dashboard/user-observations/user-observations.component';
import { SpeciesComponent } from './synthesis/species/species.component';
import { GncService } from './api/gnc.service';
import { GncProgramsService } from './api/gnc-programs.service';
import { ErrorHandler } from './api/error_handler';
import { AboutComponent } from './about/about.component';
import { AboutCustomComponent } from './about/custom/custom.component';
import { AboutFixedComponent } from './about/fixed/fixed.component';
import { HomeCustomComponent } from './home/custom/custom.component';
import { FlowComponent } from './programs/observations/modalflow/flow/flow.component';
// import { FlowService } from './programs/observations/flow/flow.service'
import { FlowDirective } from './programs/observations/modalflow/flow/flow.directive';
import { OnboardComponent } from './programs/observations/modalflow/steps/onboard/onboard.component';
import { CommittedComponent } from './programs/observations/modalflow/steps/committed/committed.component';
import { VisitStepComponent } from './programs/sites/modalflow/steps/visit/visit_step.component';
import { SiteStepComponent } from './programs/sites/modalflow/steps/site/site_step.component';
import { CongratsComponent } from './programs/observations/modalflow/steps/congrats/congrats.component';
import { SiteCongratsComponent } from './programs/sites/modalflow/steps/congrats/congrats.component';
import { ModalFlowComponent } from './programs/observations/modalflow/modalflow.component';
import { SiteModalFlowComponent } from './programs/sites/modalflow/modalflow.component';
import { RewardComponent } from './programs/observations/modalflow/steps/reward/reward.component';
import { ModalFlowService } from './programs/observations/modalflow/modalflow.service';
import { SiteModalFlowService } from './programs/sites/modalflow/modalflow.service';
import { SiteService } from './programs/sites/sites.service';
import { ProgramsResolve } from './programs/programs-resolve.service';
import { AdminComponent } from './auth/admin/admin.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ConfirmEmailComponent } from './auth/confirm-email/confirm-email.component';
import { LayoutModule } from '@angular/cdk/layout';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');
// import localeFrExtra from "@angular/common/locales/extra/fr";
// registerLocaleData(localeFr, "fr-FR", localeFrExtra);
import { Bootstrap4FrameworkModule } from '@ajsf/bootstrap4';
import { GNCFrameworkComponent } from './programs/base/jsonform/framework/framework.component';
import { ImageUploadModule } from 'angular2-image-upload';
import { UserSitesComponent } from './auth/user-dashboard/user-sites/user-sites.component';

import { AreasComponent } from './programs/areas/areas.component';
import { AreaDetailComponent } from './programs/areas/areas/detail/detail.component';
import { SpeciesSitesComponent } from './programs/areas/species_sites/species_sites.component';
import { SpeciesSitesObsComponent } from './programs/areas/observations/observations.component';
import { ObserversListComponent } from './auth/user-dashboard/admin-observers/list/observers-list.component';
import { AdminObserversComponent } from './auth/user-dashboard/admin-observers/admin-observers.component';
import { SpeciesSiteDetailComponent } from './programs/areas/species_sites/detail/detail.component';
import { SpeciesSiteObsDetailComponent } from './programs/areas/observations/detail/detail.component';
import { AreaFormComponent } from './programs/areas/areas/areaform/areaform.component';
import { SpeciesSiteFormComponent } from './programs/areas/species_sites/species_site_form/species_site_form.component';
import { SpeciesSiteObservationFormComponent } from './programs/areas/observations/observation_form/form.component';
import { PhotosModalComponent } from './programs/areas/observations/photos_modal/photos_modal.component';
import { AreasListComponent } from './programs/areas/areas/list/list.component';
import { SpeciesSitesListComponent } from './programs/areas/species_sites/list/list.component';
import { SpeciesSitesObsListComponent } from './programs/areas/observations/list/list.component';
import {
    AreasMapComponent,
    AreaMarkerPopupComponent,
} from './programs/areas/areas/map/areamap.component';
import {
    SpeciesSitesMapComponent,
    SpeciesSiteMarkerPopupComponent,
} from './programs/areas/species_sites/map/species_sites_map.component';
import { AreaStepComponent } from './programs/areas/modalflow/steps/area/area_step.component';
import { SpeciesSiteStepComponent } from './programs/areas/modalflow/steps/species_site/species_site_step.component';
import { SpeciesSiteObsStepComponent } from './programs/areas/modalflow/steps/observation/species_site_obs_step.component';
import { AreaCongratsComponent } from './programs/areas/modalflow/steps/congrats/congrats.component';
import { AreaModalFlowComponent } from './programs/areas/modalflow/modalflow.component';
import { AreaModalFlowService } from './programs/areas/modalflow/modalflow.service';
import { AreaService } from './programs/areas/areas.service';

@NgModule({
    imports: [
        BrowserModule.withServerTransition({ appId: 'serverApp' }),
        BrowserTransferStateModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,
        NgbModule,
        NgxDatatableModule,
        CommonModule,
        BrowserAnimationsModule,
        LayoutModule,
        ToastrModule.forRoot({
            preventDuplicates: true,
        }),
        routing,
        ImageUploadModule.forRoot(),
        Bootstrap4FrameworkModule,
    ],
    declarations: [
        AppComponent,
        ObsComponent,
        ObsMapComponent,
        MarkerPopupComponent,
        SiteMarkerPopupComponent,
        ObsFormComponent,
        ObsListComponent,
        SitesComponent,
        AreasComponent,
        SpeciesSitesComponent,
        SpeciesSitesObsComponent,
        ObserversListComponent,
        AdminObserversComponent,
        AreaFormComponent,
        AreasListComponent,
        SpeciesSitesListComponent,
        SpeciesSitesObsListComponent,
        AreasMapComponent,
        AreaMarkerPopupComponent,
        SpeciesSitesMapComponent,
        SpeciesSiteMarkerPopupComponent,
        AreaDetailComponent,
        SiteFormComponent,
        SiteVisitFormComponent,
        SpeciesSiteDetailComponent,
        SpeciesSiteFormComponent,
        SpeciesSiteObservationFormComponent,
        PhotosModalComponent,
        SitesListComponent,
        SitesMapComponent,
        SiteDetailComponent,
        ObsDetailComponent,
        SpeciesSiteObsDetailComponent,
        HomeComponent,
        HomeCustomComponent,
        ProgramsComponent,
        PageNotFoundComponent,
        FooterComponent,
        TopbarComponent,
        LoginComponent,
        RegisterComponent,
        LogoutComponent,
        UserDashboardComponent,
        UserObsComponent,
        SpeciesComponent,
        AboutComponent,
        AboutCustomComponent,
        AboutFixedComponent,
        FlowComponent,
        FlowDirective,
        OnboardComponent,
        CommittedComponent,
        VisitStepComponent,
        SiteStepComponent,
        SpeciesSiteStepComponent,
        SpeciesSiteObsStepComponent,
        CongratsComponent,
        SiteCongratsComponent,
        AreaCongratsComponent,
        ModalFlowComponent,
        SiteModalFlowComponent,
        AreaModalFlowComponent,
        AreaStepComponent,
        GNCFrameworkComponent,
        RewardComponent,
        AdminComponent,
        ConfirmEmailComponent,
        UserSitesComponent,
    ],
    providers: [
        AuthService,
        GncService,
        GncProgramsService,
        ErrorHandler,
        // FlowService,
        ModalFlowService,
        AreaModalFlowService,
        SiteModalFlowService,
        SiteService,
        AreaService,
        ProgramsResolve,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        { provide: LOCALE_ID, useValue: 'fr' },
        NgbActiveModal,
    ],
    bootstrap: [AppComponent],
    entryComponents: [
        LoginComponent,
        LogoutComponent,
        RegisterComponent,
        PhotosModalComponent,
        OnboardComponent,
        CommittedComponent,
        VisitStepComponent,
        SiteStepComponent,
        AreaStepComponent,
        SpeciesSiteStepComponent,
        SpeciesSiteObsStepComponent,
        CongratsComponent,
        SiteCongratsComponent,
        AreaCongratsComponent,
        RewardComponent,
        GNCFrameworkComponent,
        FlowComponent,
        MarkerPopupComponent,
        SiteMarkerPopupComponent,
        AreaMarkerPopupComponent,
        SpeciesSiteMarkerPopupComponent,
    ],
    exports: [AdminComponent],
})
export class AppModule {
    constructor(@Inject(LOCALE_ID) localeId: string) {
        this.localeInitializer(localeId).then(() => {
            console.info(`Locale: ${localeId}.`);
        });
    }

    async localeInitializer(localeId: string): Promise<any> {
        const module = await import(
            /* webpackInclude: /(fr|en)\.js$/ */
            `@angular/common/locales/${localeId}.js`
        );
        return registerLocaleData(module.default);
    }
}
