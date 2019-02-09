import { Component, OnInit , ViewEncapsulation} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { Meta } from '@angular/platform-browser';

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
    // private meta: Meta,
  ) { }

  ngOnInit() {
    this.route.data
      .subscribe((data: { programs: Program[] }) => {
        this.programs = data.programs
    })
    // this.meta.updateTag({
    //    name: 'description',
    //    content: '...my description'
    //  });
  }
}
