import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';


import {AppComponent} from './app.component';
import {SightsComponent} from './surveys/sights/sights.component';
import {SightsMapComponent} from './surveys/sights/map/map.component';
import {SightsFormComponent} from './surveys/sights/form/form.component';
import {SightsListComponent} from './surveys/sights/list/list.component';
import {HomeComponent} from './home/home.component';
import {SurveysComponent} from './surveys/surveys.component';
import {RegisterComponent} from './register/register.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {routing} from './app.routing';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


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
    SurveysComponent,
    RegisterComponent,
    PageNotFoundComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
