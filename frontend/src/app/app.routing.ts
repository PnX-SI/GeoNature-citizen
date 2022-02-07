import { AboutComponent } from './about/about.component';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ObsComponent } from './programs/observations/obs.component';
import { SitesComponent } from './programs/sites/sites.component';
import { AreasComponent } from './programs/areas/areas.component';
import { SpeciesSitesComponent } from './programs/areas/species_sites/species_sites.component';
import { SpeciesSitesObsComponent } from './programs/areas/observations/observations.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ProgramsComponent } from './programs/programs.component';
import { ProgramsResolve } from './programs/programs-resolve.service';
import { UserDashboardComponent } from './auth/user-dashboard/user-dashboard.component';
import { SpeciesComponent } from './synthesis/species/species.component';
import { AuthGuard } from './auth/auth.guard';
import { AreaDetailComponent } from './programs/areas/areas/detail/detail.component';
import { SpeciesSiteDetailComponent } from './programs/areas/species_sites/detail/detail.component';
import { SiteDetailComponent } from './programs/sites/detail/detail.component';
import { ObsDetailComponent } from './programs/observations/detail/detail.component';
import { SpeciesSiteObsDetailComponent } from './programs/areas/observations/detail/detail.component';
import { AdminComponent } from './auth/admin/admin.component';
import { ConfirmEmailComponent } from './auth/confirm-email/confirm-email.component';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: HomeComponent,
        resolve: { programs: ProgramsResolve },
    },
    { path: 'about', component: AboutComponent },
    {
        path: 'mydashboard',
        component: UserDashboardComponent,
    },
    {
        path: 'api/admin',
        component: AdminComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'programs',
        component: ProgramsComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'programs/:id/observations',
        component: ObsComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'confirmEmail/:token',
        component: ConfirmEmailComponent,
    },
    {
        path: 'programs/:id/sites',
        component: SitesComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'programs/:id/areas',
        component: AreasComponent,
        resolve: { programs: ProgramsResolve },
    },
    { path: 'synthesis/species/:id', component: SpeciesComponent },
    {
        path: 'programs/:program_id/sites/:site_id',
        component: SiteDetailComponent,
    },
    {
        path: 'programs/:program_id/areas/:area_id',
        component: AreaDetailComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'programs/:program_id/species_sites',
        component: SpeciesSitesComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'programs/:program_id/areas-observations',
        component: SpeciesSitesObsComponent,
        resolve: { programs: ProgramsResolve },
    },
    {
        path: 'programs/:program_id/species_sites/:species_site_id',
        component: SpeciesSiteDetailComponent,
    },
    {
        path: 'programs/:program_id/observations/:obs_id',
        component: ObsDetailComponent,
    },
    {
        path: 'programs/:program_id/areas-observations/:obs_id',
        component: SpeciesSiteObsDetailComponent,
    },
    { path: '**', component: PageNotFoundComponent },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
    initialNavigation: 'enabled',
    useHash: false,
    // enableTracing: true,
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 113], // TODO: source from conf: router-outlet height
});
