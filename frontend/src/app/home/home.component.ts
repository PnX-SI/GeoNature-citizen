import { Component, OnInit , ViewEncapsulation} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ProgramsResolve } from '../programs/programs-resolve.service';
import { Program } from '../programs/programs.models';

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
  programs: Program[]

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.data
      .subscribe((data: { programs: Program[] }) => {
        this.programs = data.programs
    })
  }
}
