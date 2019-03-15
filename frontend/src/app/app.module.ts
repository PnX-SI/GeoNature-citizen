import { LOCALE_ID, NgModule } from "@angular/core";
import {
  BrowserModule,
  BrowserTransferStateModule
} from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { AppComponent } from "./app.component";
import { routing } from "./app.routing";
import { AuthService } from "./auth/auth.service";
import { AuthInterceptor } from "./auth/auth.interceptor";
import { LoginComponent } from "./auth/login/login.component";
import { LogoutComponent } from "./auth/logout/logout.component";
import { RegisterComponent } from "./auth/register/register.component";
import { FooterComponent } from "./core/footer/footer.component";
import { SidebarComponent } from "./core/sidebar/sidebar.component";
import { TopbarComponent } from "./core/topbar/topbar.component";
import { HomeComponent } from "./home/home.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { DescModalComponent } from "./programs/desc-modal/desc-modal.component";
import { ProgramsComponent } from "./programs/programs.component";
import { ObsFormComponent } from "./programs/observations/form/form.component";
import { ObsListComponent } from "./programs/observations/list/list.component";
import { ObsMapComponent } from "./programs/observations/map/map.component";
import { ObsComponent } from "./programs/observations/obs.component";
import { SitesListComponent } from "./programs/sites/list/list.component";
import { SitesMapComponent } from "./programs/sites/map/map.component";
import { SitesComponent } from "./programs/sites/sites.component";
import { SiteFormComponent } from "./programs/sites/siteform/siteform.component";
import { SiteVisitFormComponent } from "./programs/sites/form/form.component";
import { SiteDetailComponent } from "./programs/sites/detail/detail.component";
import { UserDashboardComponent } from "./auth/user-dashboard/user-dashboard.component";
import { SpeciesComponent } from "./synthesis/species/species.component";
import { GncService } from "./api/gnc.service";
import { GncProgramsService } from "./api/gnc-programs.service";
import { AboutComponent } from "./about/about.component";
import { AboutCustomComponent } from "./about/custom/custom.component";
import { AboutFixedComponent } from "./about/fixed/fixed.component";
import { HomeCustomComponent } from "./home/custom/custom.component";
import { FlowComponent } from "./programs/observations/modalflow/flow/flow.component";
// import { FlowService } from './programs/observations/flow/flow.service'
import { FlowDirective } from "./programs/observations/modalflow/flow/flow.directive";
import { OnboardComponent } from "./programs/observations/modalflow/steps/onboard/onboard.component";
import { CommittedComponent } from "./programs/observations/modalflow/steps/committed/committed.component";
import { VisitStepComponent } from "./programs/sites/modalflow/steps/visit/visit_step.component";
import { SiteStepComponent } from "./programs/sites/modalflow/steps/site/site_step.component";
import { CongratsComponent } from "./programs/observations/modalflow/steps/congrats/congrats.component";
import { ModalFlowComponent } from "./programs/observations/modalflow/modalflow.component";
import { SiteModalFlowComponent } from "./programs/sites/modalflow/modalflow.component";
import { RewardComponent } from "./programs/observations/modalflow/steps/reward/reward.component";
import { ModalFlowService } from "./programs/observations/modalflow/modalflow.service";
import { SiteModalFlowService } from "./programs/sites/modalflow/modalflow.service";
import { ProgramsResolve } from "./programs/programs-resolve.service";
import { AppConfig } from "../conf/app.config";

import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
registerLocaleData(localeFr, "fr");
// import localeFrExtra from "@angular/common/locales/extra/fr";
// registerLocaleData(localeFr, "fr-FR", localeFrExtra);
import { Bootstrap4FrameworkModule } from 'angular6-json-schema-form';
import { GNCBootstrap4FrameworkComponent } from "./programs/sites/form/gnc-bootstrap-4-framework/gnc-bootstrap-4-framework.component"

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserTransferStateModule,
    HttpClientModule,
    HttpModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    routing,
    Bootstrap4FrameworkModule
  ],
  declarations: [
    AppComponent,
    ObsComponent,
    ObsMapComponent,
    ObsFormComponent,
    ObsListComponent,
    SitesComponent,
    SiteFormComponent,
    SiteVisitFormComponent,
    SitesListComponent,
    SitesMapComponent,
    SiteDetailComponent,
    HomeComponent,
    HomeCustomComponent,
    ProgramsComponent,
    PageNotFoundComponent,
    DescModalComponent,
    SidebarComponent,
    FooterComponent,
    TopbarComponent,
    LoginComponent,
    RegisterComponent,
    LogoutComponent,
    UserDashboardComponent,
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
    CongratsComponent,
    ModalFlowComponent,
    SiteModalFlowComponent,
    RewardComponent,
    GNCBootstrap4FrameworkComponent
  ],
  providers: [
    AuthService,
    GncService,
    GncProgramsService,
    // FlowService,
    ModalFlowService,
    SiteModalFlowService,
    ProgramsResolve,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: LOCALE_ID, useValue: "fr" }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    DescModalComponent,
    LoginComponent,
    LogoutComponent,
    RegisterComponent,
    OnboardComponent,
    CommittedComponent,
    VisitStepComponent,
    SiteStepComponent,
    CongratsComponent,
    RewardComponent,
    GNCBootstrap4FrameworkComponent
  ]
})
export class AppModule {}
