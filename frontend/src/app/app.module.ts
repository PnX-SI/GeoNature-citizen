import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import { HttpClientModule} from '@angular/common/http';


import {AppComponent} from './app.component';
import {SightsComponent} from './sights/sights.component';
import {MapComponent} from './sights/map/map.component';
import {FormComponent} from './sights/form/form.component';
import {ListComponent} from './sights/list/list.component';
import {HomeComponent} from './home/home.component';
import {SurveysComponent} from './surveys/surveys.component';
import {RegisterComponent} from './register/register.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {routing} from './app.routing';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';



@NgModule({
  imports: [
    BrowserModule,
    NgbModule,
    HttpClientModule,
    routing
  ],
  declarations: [
    AppComponent,
    SightsComponent,
    MapComponent,
    FormComponent,
    ListComponent,
    HomeComponent,
    SurveysComponent,
    RegisterComponent,
    PageNotFoundComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
