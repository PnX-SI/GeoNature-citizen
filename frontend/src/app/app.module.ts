import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SightsComponent } from './sights/sights.component';
import { MapComponent } from './sights/map/map.component';
import { FormComponent } from './sights/form/form.component';
import { ListComponent } from './sights/list/list.component';
import { HomeComponent } from './home/home.component';
import { SurveysComponent } from './surveys/surveys.component';

@NgModule({
  declarations: [
    AppComponent,
    SightsComponent,
    MapComponent,
    FormComponent,
    ListComponent,
    HomeComponent,
    SurveysComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
