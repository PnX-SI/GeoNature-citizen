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
import { ObsComponent } from "../../../programs/observations/obs.component";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { Point } from "leaflet";


@Component({
  selector: "user-observations",
  templateUrl: "../../../programs/observations/obs.component.html",
  styleUrls: ["../../../programs/observations/obs.component.css", "../../../home/home.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class UserObsComponent extends ObsComponent implements OnInit {
  @Input("myobs") myObs;
  @Output() deleteObs = new EventEmitter();
  userDashboard = true;

  ngOnInit() {
    this.breakpointObserver
      .observe(["(min-width: 700px)"])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobile = false;
        } else {
          this.isMobile = true;
        }
      });
    this.observations = this.myObs;
    // Create species list for filtering
    let all_species = []
    let uniq_cd_nom_list = []
    this.observations.features.map(f => f.properties).forEach((props) => {
      let cd_nom = props.taxref.cd_nom
      if (!uniq_cd_nom_list.includes(cd_nom)) {
        uniq_cd_nom_list.push(cd_nom)
        all_species.push(props)
      }
    })
    this.surveySpecies = all_species;
  }

  getCoords(obs) {
    let coords: Point = new Point(
      obs.geometry.coordinates[0],
      obs.geometry.coordinates[1]
    );
    console.log(obs, coords);
  }
}
