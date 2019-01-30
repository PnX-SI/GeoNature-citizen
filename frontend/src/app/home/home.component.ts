import { Component, OnInit , ViewEncapsulation} from '@angular/core';

// import { SightsComponent } from '../programs/sights/sights.component'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
