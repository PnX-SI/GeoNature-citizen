import { AboutComponent } from "./about/about.component";
import { ModuleWithProviders } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { HomeComponent } from "./home/home.component"; //import home components
import { SightsComponent } from "./programs/sights/sights.component"; //import sights component
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { ProgramsComponent } from "./programs/programs.component";
import { ProgramsResolveService } from './programs/programs-resolve.service'
import { UniqueProgramGuard } from "./programs/default-program.guard";
import { UserDashboardComponent } from "./auth/user-dashboard/user-dashboard.component";
import { SpeciesComponent } from "./synthesis/species/species.component";

const appRoutes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full", },
  { path: "home", component: HomeComponent, canActivate: [UniqueProgramGuard], resolve: { programs: ProgramsResolveService} },
  { path: "about", component: AboutComponent },
  { path: "mydashboard", component: UserDashboardComponent },
  { path: "programs", component: ProgramsComponent },
  { path: "programs/:id/sights", component: SightsComponent },
  { path: "synthesis/species/:id", component: SpeciesComponent },
  { path: "**", component: PageNotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  enableTracing: true
});
