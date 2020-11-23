import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ViewChildren,
  QueryList,
  HostListener,
  Inject,
  LOCALE_ID,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { SitesComponent } from "../../../programs/sites/sites.component";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { Point } from "leaflet";

@Component({
  selector: 'user-sites',
  templateUrl: "../../../programs/sites/sites.component.html",
    styleUrls: ["../../../programs/sites/sites.component.css", "../../../home/home.component.css"],
    encapsulation: ViewEncapsulation.None
})
export class UserSitesComponent extends SitesComponent implements OnInit {
    @Input("mysites") mySites;
    @Output() deleteSite = new EventEmitter();
    userDashboard = true;

  ngOnInit() {
    this.sites = this.mySites;
  }

  getCoords(site) {
    let coords: Point = new Point(
      site.geometry.coordinates[0],
      site.geometry.coordinates[1]
    );
    console.log(site, coords);
  }

}
