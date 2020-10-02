import { Component, OnInit } from '@angular/core';
import { AppConfig } from "../../../conf/app.config";

@Component({
  selector: 'app-footer',
  templateUrl: '../../../custom/footer/footer.html',
  styleUrls: ['../../../custom/footer/footer.css']
})
export class FooterComponent implements OnInit {

  public appConfig = AppConfig;

  constructor() { }

  ngOnInit() {
  }

}
