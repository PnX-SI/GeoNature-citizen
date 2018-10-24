
import { ModuleWithProviders } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { HomeComponent } from "./home/home.component"; //import home components
import { SightsComponent } from "./programs/sights/sights.component"; //import sights component
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { ProgramsComponent } from "./programs/programs.component";
import { UserDashboardComponent} from "./auth/user-dashboard/user-dashboard.component";

const appRoutes: Routes = [
  { path: "", component: HomeComponent },
  { path: "mydashboard", component: UserDashboardComponent },
  { path: "programs", component: ProgramsComponent },
  { path: "programs/:id/sights", component: SightsComponent },
  { path: "**", component: PageNotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, {
  enableTracing: true
});
