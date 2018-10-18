import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';


import {AppComponent} from './app.component';
import {SightsComponent} from './programs/sights/sights.component';
import {SightsMapComponent} from './programs/sights/map/map.component';
import {SightsFormComponent} from './programs/sights/form/form.component';
import {SightsListComponent} from './programs/sights/list/list.component';
import {HomeComponent} from './home/home.component';
import { ProgramsComponent } from './programs/programs.component';
import {RegisterComponent} from './register/register.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {routing} from './app.routing';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DescModalComponent } from './programs/desc-modal/desc-modal.component';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { FooterComponent } from './core/footer/footer.component';
import { TopbarComponent } from './core/topbar/topbar.component';


@NgModule({
  imports: [
    BrowserModule,
    NgbModule,
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
    RegisterComponent,
    PageNotFoundComponent,
    DescModalComponent,
    SidebarComponent,
    FooterComponent,
    TopbarComponent
  ],
  bootstrap: [AppComponent]
  ,     entryComponents: [
    DescModalComponent
]
})
export class AppModule {
}
