import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {HomeComponent} from './home/home.component'; //import home components
import {SightsComponent} from './surveys/sights/sights.component'; //import sights component
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {SurveysComponent} from './surveys/surveys.component';

const appRoutes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'surveys', component: SurveysComponent},
  {path: 'surveys/:id/sights', component: SightsComponent},
  {path: '**', component: PageNotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes,  { enableTracing: true } );




