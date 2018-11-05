import { GncProgramsService } from './api/gnc-programs.service';
import { HttpClientModule } from "@angular/common/http";
import { HttpModule } from "@angular/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { AppComponent } from "./app.component";
import { routing } from "./app.routing";
import { AuthService } from "./auth/auth.service";
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
import { SightsFormComponent } from "./programs/sights/form/form.component";
import { SightsListComponent } from "./programs/sights/list/list.component";
import { SightsMapComponent } from "./programs/sights/map/map.component";
import { SightsComponent } from "./programs/sights/sights.component";
import { UserDashboardComponent } from "./auth/user-dashboard/user-dashboard.component";
import { SpeciesComponent } from "./synthesis/species/species.component";
import { IntroComponent } from "./home/intro/intro.component";
import { GncService } from "./api/gnc.service";

@NgModule({
  imports: [
    BrowserModule,
    NgbModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    routing
  ],
  declarations: [
    AppComponent,
    SightsComponent,
    SightsMapComponent,
    SightsFormComponent,
    SightsListComponent,
    HomeComponent,
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
    IntroComponent
  ],
  providers: [AuthService, GncService, GncProgramsService],
  bootstrap: [AppComponent],
  entryComponents: [
    DescModalComponent,
    LoginComponent,
    LogoutComponent,
    RegisterComponent
  ]
})
export class AppModule {}
