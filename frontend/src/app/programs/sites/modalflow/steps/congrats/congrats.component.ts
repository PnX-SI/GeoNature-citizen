import { Component, Input, ViewEncapsulation } from "@angular/core";

import { IFlowComponent } from "../../../../observations/modalflow/flow/flow";
import { AppConfig } from "../../../../../../conf/app.config";

@Component({
  templateUrl: "./congrats.component.html",
  styleUrls: ["./congrats.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteCongratsComponent implements IFlowComponent {
  @Input() data: any;
  timeout: any;
  username: string;
  AppConfig = AppConfig;

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  ngOnInit(): void {
    this.username = localStorage.getItem("username");
    console.debug("congrats action > data:", this.data);
    this.timeout = setTimeout(() => {
      this.data.next(this.data);
    }, 2000);
  }
}
