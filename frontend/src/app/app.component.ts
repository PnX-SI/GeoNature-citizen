
import { AppConfig } from './../conf/app.config';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit{
  title = 'GeoNature-citizen';
  public appConfig: any;

  ngOnInit() {
    this.appConfig = AppConfig;
  }
}
