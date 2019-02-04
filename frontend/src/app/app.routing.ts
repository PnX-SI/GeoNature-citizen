import { AboutComponent } from "./about/about.component";
import { ModuleWithProviders } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { HomeComponent } from "./home/home.component"; //import home components
import { ObsComponent } from "./programs/observations/obs.component"; //import observations component
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { ProgramsComponent } from "./programs/programs.component";
import { ProgramsResolve } from './programs/programs-resolve.service'
import { UniqueProgramGuard } from "./programs/default-program.guard";
import { UserDashboardComponent } from "./auth/user-dashboard/user-dashboard.component";
import { SpeciesComponent } from "./synthesis/species/species.component";

const appRoutes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full"/*, canActivate: [UniqueProgramGuard], resolve: { programs: ProgramsResolve}*/ },
  { path: "home", component: HomeComponent, canActivate: [UniqueProgramGuard], resolve: { programs: ProgramsResolve} },
  { path: "about", component: AboutComponent },
  { path: "mydashboard", component: UserDashboardComponent },
  { path: "programs", component: ProgramsComponent },
  { path: "programs/:id/observations", component: ObsComponent },
  { path: "synthesis/species/:id", component: SpeciesComponent },
  { path: "**", component: PageNotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  enableTracing: true
});
