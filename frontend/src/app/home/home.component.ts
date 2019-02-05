import { Component, OnInit , ViewEncapsulation} from '@angular/core';
import { ProgramsResolve } from '../programs/programs-resolve.service';

// import { ObsComponent } from '../programs/observations/obs.component'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    ProgramsResolve,
  ]
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
